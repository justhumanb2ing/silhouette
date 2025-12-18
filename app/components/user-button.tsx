import {
  SignInButton,
  SignUpButton,
  useClerk,
  useUser,
} from "@clerk/react-router";
import { Button } from "./ui/button";
import { useIntlayer } from "react-intlayer";
import { LocalizedLink } from "./localized-link";

export default function UserButton() {
  const {
    layout: {
      auth: { signIn, signUp },
    },
  } = useIntlayer("landing-page");
  const { profile, signOut: signOutLabel } = useIntlayer("user-button");

  // Grab the `isLoaded` and `user` from useUser()
  const { isLoaded, user, isSignedIn } = useUser();
  const { signOut } = useClerk();

  // Make sure that the useUser() hook has loaded
  if (!isLoaded) return null;

  return isSignedIn ? (
    <>
      <Button size={"icon"} className={"overflow-hidden"}>
        <img
          src={user?.imageUrl}
          alt={user?.primaryEmailAddress?.emailAddress!}
          width={30}
          height={30}
          className="object-cover w-full h-full"
        />
      </Button>
      <LocalizedLink to={`/user/${user.id}`}>{profile}</LocalizedLink>
      <Button variant={"ghost"} onClick={() => signOut()}>
        {signOutLabel}
      </Button>
      <Button
        variant="ghost"
        render={
          <SignInButton>
            <span>{signIn}</span>
          </SignInButton>
        }
      />
      <Button
        render={
          <SignUpButton>
            <span>{signUp}</span>
          </SignUpButton>
        }
      />
    </>
  ) : (
    <>
      <Button
        variant="ghost"
        render={
          <SignInButton>
            <span>{signIn}</span>
          </SignInButton>
        }
      />
      <Button
        render={
          <SignUpButton>
            <span>{signUp}</span>
          </SignUpButton>
        }
      />
    </>
  );
}
