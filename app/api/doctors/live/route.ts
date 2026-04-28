// app/api/doctors/live/route.ts
import { databases } from "@/lib/appwrite.config"
import { Query } from "node-appwrite"
import { NextRequest } from "next/server"

export const dynamic = "force-dynamic"

export async function GET(req: NextRequest) {
  const doctorId = req.nextUrl.searchParams.get("doctorId")
  if (!doctorId) return new Response("Missing doctorId", { status: 400 })

  const encoder = new TextEncoder()
  let interval: ReturnType<typeof setInterval>

  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: object) => {
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`))
        } catch { /* client disconnected */ }
      }

      const poll = async () => {
        try {
          // ── 1. Appointments ──────────────────────────────────
          const doctorDoc = await databases.getDocument(
            process.env.DATABASE_ID!,
            process.env.DOCTOR_COLLECTION_ID!,
            doctorId
            )

            const apptRes = await databases.listDocuments(
              process.env.DATABASE_ID!,
              process.env.APPOINTMENT_COLLECTION_ID!,
              [
                Query.equal("primaryDoctor", doctorDoc.name),
                Query.orderDesc("$createdAt"),
                Query.limit(50),
                Query.select(["*", "patient.*"]),  // ← populate patient relation
              ]
            )
            send({ type: "appointments", data: apptRes.documents })

            // Reuse doctorDoc for slots (no second getDocument needed)
            send({
            type: "slots",
            blockedSlots: doctorDoc.blockedSlots ?? "{}",
            bookedSlots: doctorDoc.bookedSlots ?? "{}",
            })
        } catch (e) {
          console.error("SSE poll error:", e)
        }
      }

      // Send immediately on connect, then every 5s
      await poll()
      interval = setInterval(poll, 5000)
    },
    cancel() {
      clearInterval(interval)
    },
  })

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  })
}