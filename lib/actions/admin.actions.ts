// 'use server'

// import { Query } from "node-appwrite"
// import { users } from "../appwrite.config"

// // ———— USER MANAGEMENT ————

// export const listAllUsers = async () => {
//     try {
//         const result = await users.list()
//         return result.users
//     } catch (error) {
//         console.log(error)
//         return null
//     }
// }

// export const deleteUser = async (userId: string) => {
//     try {
//         await users.delete(userId)
//         return true
//     } catch (error) {
//         console.log(error)
//         return false
//     }
// }

// export const blockUser = async (userId: string) => {
//     try {
//         await users.updateStatus(userId, false) // false = blocked
//         return true
//     } catch (error) {
//         console.log(error)
//         return false
//     }
// }

// export const unblockUser = async (userId: string) => {
//     try {
//         await users.updateStatus(userId, true) // true = active
//         return true
//     } catch (error) {
//         console.log(error)
//         return false
//     }
// }

// export const searchUsers = async (query: string) => {
//     try {
//         const result = await users.list([Query.search('name', query)])
//         return result.users
//     } catch (error) {
//         console.log(error)
//         return null
//     }
// }