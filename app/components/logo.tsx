import { LocalizedLink } from "./localized-link";

export default function Logo() {
  return (
    <div className="overflow-hidden">
      <LocalizedLink to={"/"}>로고</LocalizedLink>
    </div>
  );
}
