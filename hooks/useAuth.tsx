import {
  createContext,
  useContext,
  useState,
  useEffect,
  PropsWithChildren,
} from "react";
import { Amplify, Auth, Hub } from "aws-amplify";

Amplify.configure({
  aws_project_region: process.env.NEXT_PUBLIC_AWS_REGION,
  aws_user_pools_id: process.env.NEXT_PUBLIC_AWS_USER_POOLS_ID,
  aws_user_pools_web_client_id:
    process.env.NEXT_PUBLIC_AWS_USER_POOLS_WEB_CLIENT_ID,
});

const authContext = createContext<Auth>({} as Auth);

export const ProvideAuth: React.FC<PropsWithChildren> = ({ children }) => {
  const auth = useProvideAuth();
  return <authContext.Provider value={auth}>{children}</authContext.Provider>;
};

export const useAuth = () => {
  return useContext(authContext);
};

interface Auth {
  user: null | false | { username: string };
  error: any;
  signIn: (email: string, password: string) => Promise<{ username: string }>;
  signOut: () => void;
}

export const useProvideAuth = () => {
  const [user, setUser] = useState<any>(null);
  const [error, setError] = useState(null);

  const signIn = (email: string, password: string) =>
    Auth.signIn(email, password)
      .then((user) => {
        setUser(user);
        return user;
      })
      .catch((err) => {
        setError(err);
      });

  const signOut = () =>
    Auth.signOut()
      .then(() => setUser(null))
      .catch((err) => setError(err));

  // https://docs.amplify.aws/lib/auth/auth-events/q/platform/js/
  useEffect(() => {
    if (!user) {
      Auth.currentAuthenticatedUser()
        .then((user) => {
          if (user) {
            setUser(user);
          } else {
            setUser(false);
          }
        })
        .catch((err) => {
          if (err === "The user is not authenticated") {
            setUser(false);
          } else {
            console.error(err);
          }
        });
    }
    const unsubscribe = Hub.listen("auth", (data) => {
      switch (data.payload.event) {
        case "signIn":
          if (data.payload.data) {
            setUser(user);
            setError(null);
          }
          console.log("user signed in");
          break;
        case "signUp":
          console.log("user signed up");
          break;
        case "signOut":
          setUser(null);
          setError(null);
          console.log("user signed out");
          break;
        case "signIn_failure":
          console.log("user sign in failed");
          break;
        case "configured":
          if (data.payload.data) {
            console.log(data);
            // setUser(user);
          }
          console.log("the Auth module is configured");
      }
    });
    return () => unsubscribe();
  }, [user]);

  return {
    user,
    error,
    signIn,
    signOut,
  };
};
