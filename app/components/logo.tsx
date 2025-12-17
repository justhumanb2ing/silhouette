import { LocalizedLink } from "./localized-link";

export default function Logo() {
  return (
    <div className="size-10 overflow-hidden rounded-xl">
      <LocalizedLink to={"/"}>
        <img src={"/test-logo.avif"} alt="Logo" className="scale-150" />
      </LocalizedLink>
    </div>
  );
}
