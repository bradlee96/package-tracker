import './TrackingInfo.css';

import { TableRow, TableCell } from '@material-ui/core';

export default function TrackingInfo(props) {
  return (
    <TableRow>
      <TableCell>
        {props.timestamp}
      </TableCell>

      {props.isMobile ?
        <TableCell>
          <a href={props.messageLink} target="_blank" rel="noreferrer">
            {props.sender.replace(/ *<[^)]*> */g, "")}
          </a>
        </TableCell> : <TableCell>
          {props.sender}
        </TableCell>
      }

      {props.isMobile ?
        <TableCell>
          <a href={props.trackingLink} target="_blank" rel="noreferrer">
            {props.courier}
          </a>
        </TableCell> : <TableCell>
          {props.courier}
        </TableCell>
      }

      {/* <TableCell>{props.number}</TableCell> */}

      {!props.isMobile &&
        <TableCell>
          <a href={props.trackingLink} target="_blank" rel="noreferrer">
            {props.number}
          </a>
        </TableCell>
      }

      {!props.isMobile &&
        <TableCell>
          <a href={props.messageLink} target="_blank" rel="noreferrer">
            Email
          </a>
        </TableCell>
      }
    </TableRow>
  );
}

