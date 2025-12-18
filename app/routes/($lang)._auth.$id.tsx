import { useParams } from "react-router";

export default function UserRoute() {
  const { id } = useParams();
  return <div>User id: {id}</div>;
}
