export default function TrackingInfo(props) {
  return (
    <tr>
      <td>{props.timestamp}</td>
      <td>{props.sender}</td>
      {/* <td>{props.courier}</td> */}
      <td>{props.number}</td>
      <td><a href={props.trackingLink} target="_blank" rel="noreferrer">{props.courier} <i className="fas fa-external-link-alt"></i></a></td>
      <td><a href={props.messageLink} target="_blank" rel="noreferrer">Email <i className="fas fa-external-link-alt"></i></a></td>
    </tr>
  );
}
