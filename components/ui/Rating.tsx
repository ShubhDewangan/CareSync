'use client'
import * as React from 'react';
import Box from '@mui/material/Box';
import Rating from '@mui/material/Rating';
import Typography from '@mui/material/Typography';

export default function StarRating({rating}: {rating: number}) {
  const [value, setValue] = React.useState<number | null>(rating);

  return (
    <Box sx={{ '& > legend': { mt: 2 } }}>
      {/* <Typography component="legend">Controlled</Typography> */}
      <Rating
        name="simple-controlled"
        value={value}
        precision={0.1}
        // readOnly
        onChange={(event, newValue) => {
          setValue(newValue);
        }}
      />
      {/* <Typography component="legend">Uncontrolled</Typography>
      <Rating
        name="simple-uncontrolled"
        onChange={(event, newValue) => {
          console.log(newValue);
        }}
        defaultValue={2} */}
    {/* //   />
    //   <Typography component="legend">Read only</Typography>
    //   <Rating name="read-only" value={value} readOnly />
    //   <Typography component="legend">Disabled</Typography>
    //   <Rating name="disabled" value={value} disabled />
    //   <Typography component="legend">No rating given</Typography>
    //   <Rating name="no-value" value={null} /> */}
    </Box>
  );
}
