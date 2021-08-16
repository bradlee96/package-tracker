import { Box, Grid, Link, Typography } from '@material-ui/core';
import GitHubIcon from '@material-ui/icons/GitHub';


export default function Footer() {
  return (
    <footer>
      <Grid container direction="column" item spacing={1}>
        <Grid item align="center">
          <Box display={{ xs: 'none', md: 'block' }}>
          <Typography variant="caption">
            Currently, this web app only works with Gmail. There may be false positives.
          </Typography>
          </Box>
        </Grid>
        <Grid item align="center">
          <Typography variant="caption">
            <Link href="https://github.com/bradlee96/package-tracker" target="_blank" rel="noreferrer">
              <GitHubIcon />
            </Link>
          </Typography>
        </Grid>
      </Grid>
    </footer>
  )
}