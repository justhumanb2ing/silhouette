import {
  SignInButton,
  SignUpButton,
  useClerk,
  useUser,
} from "@clerk/react-router";
import { Button } from "./ui/button";
import { useIntlayer } from "react-intlayer";
import { LocalizedLink } from "./localized-link";
import { Separator } from "./ui/separator";

export default function UserButton() {
  const {
    layout: {
      auth: { signIn, signUp },
    },
  } = useIntlayer("landing-page");
  const { signOut: signOutLabel } = useIntlayer("user-button");

  // Grab the `isLoaded` and `user` from useUser()
  const { isLoaded, user, isSignedIn } = useUser();
  const { signOut } = useClerk();

  // Make sure that the useUser() hook has loaded
  if (!isLoaded) return null;

  return (
    <aside className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 flex items-center gap-4 border border-input p-3 bg-muted/60 backdrop-blur-sm">
      {isSignedIn ? (
        <>
          <LocalizedLink
            to={`/user/${user.id}`}
            className="text-sm flex items-center gap-1"
          >
            {user.fullName}
          </LocalizedLink>
          <Separator orientation="vertical" className={'my-1'} />
          <Button variant={"ghost"} onClick={() => signOut()}>
            {signOutLabel}
          </Button>
        </>
      ) : (
        <>
          <Button
            variant="ghost"
            className={"cursor-pointer"}
            render={
              <SignInButton>
                <span>{signIn}</span>
              </SignInButton>
            }
          />
          <Button
            className={"cursor-pointer"}
            render={
              <SignUpButton>
                <span>{signUp}</span>
              </SignUpButton>
            }
          />
        </>
      )}
    </aside>
  );
}
