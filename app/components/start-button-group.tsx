import { useIntlayer } from "react-intlayer";
import { Button } from "./ui/button";
import { useUser } from "@clerk/react-router";

export default function StartButtonGroup() {
  const {
    layout: {
      auth: { signIn, signUp },
    },
  } = useIntlayer("landing-page");

  const { isLoaded, user, isSignedIn } = useUser();

  if (!isLoaded) return null;

  const signedInHref =
    isSignedIn && user?.id ? `/user/${user.id}` : null;
  const signInHref = signedInHref ?? "/sign-in";
  const signUpHref = signedInHref ?? "/sign-up";

  return (
    <div className="flex items-center gap-2">
      <a href={signInHref}>
        <Button variant={"ghost"}>{signIn}</Button>
      </a>
      <a href={signUpHref}>
        <Button>{signUp}</Button>
      </a>
    </div>
  );
}
