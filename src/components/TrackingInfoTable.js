import { useState } from 'react';

import './TrackingInfoTable.css';
import TrackingInfo from './TrackingInfo';

import { Table, TableBody, TableCell, TableContainer, TableFooter, TableHead, TablePagination, TableRow, Typography } from '@material-ui/core';

const courierLink = {
  'FedEx': 'https://www.fedex.com/fedextrack/?action=track&trackingnumber=',
  'UPS': 'https://www.ups.com/track?tracknum=',
  'DHL': 'https://www.dhl.com/us-en/home/tracking/tracking-express.html?submit=1&tracking-id=',
  'USPS': 'https://tools.usps.com/go/TrackConfirmAction?&tLabels='
}

export default function TrackingInfoTable(props) {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(props.isMobile ? 3 : 5);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  return (
    <>
      {props.allTrackingInfo &&
        <>
          {
            props.allTrackingInfo.length > 0 ?
              <>
                <TableContainer className="table-container">
                  <Table size={props.isMobile ? 'small' : 'medium'}>
                    <TableHead>
                      <TableRow>
                        <TableCell>Date</TableCell>
                        <TableCell>Sender</TableCell>
                        {props.isMobile ?
                          <TableCell>Tracking</TableCell> : <TableCell>Carrier</TableCell>
                        }
                        {!props.isMobile && <TableCell>Tracking Number</TableCell>}
                        {/* <TableCell>Tracking Link</TableCell> */}
                        {!props.isMobile && <TableCell>Email</TableCell>}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {(rowsPerPage > 0
                        ? props.allTrackingInfo.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                        : props.allTrackingInfo
                      ).map((row) => (
                        <TrackingInfo
                          key={row['number']}
                          number={row['number']}
                          sender={row['sender']}
                          courier={row['courier']}
                          messageLink={'https://mail.google.com/mail?authuser=' + props.emailAddress + '#all/' + row['threadId']}
                          trackingLink={courierLink[row['courier']] + row['number']}
                          timestamp={new Date(1 * row['timestamp']).toLocaleDateString()}
                          isMobile={props.isMobile}
                        />
                      ))}
                    </TableBody>
                    <TableFooter>
                      <TableRow>
                      </TableRow>
                    </TableFooter>
                  </Table>
                </TableContainer>
                <TablePagination
                  rowsPerPageOptions={[5]}
                  component="div"
                  count={props.allTrackingInfo.length}
                  rowsPerPage={rowsPerPage}
                  page={page}
                  onPageChange={handleChangePage}
                  onRowsPerPageChange={handleChangeRowsPerPage}
                />
              </> : <Typography>
                No tracking numbers found in the past 90 days.
              </Typography>
          }
        </>
      }
    </>
  )
}