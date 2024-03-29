import { useEffect, useRef, useState } from "react";
import { Box, Button, Container, HStack, Input, VStack } from "@chakra-ui/react";
import Message from "./components/Message";
import { app } from "./firebase";
import { onAuthStateChanged, getAuth, GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth"
import { getFirestore, addDoc, collection, serverTimestamp, onSnapshot, query, orderBy } from "firebase/firestore"

const auth = getAuth(app);
const db = getFirestore(app);

const loginHandler = () => {
  const provider = new GoogleAuthProvider();
  signInWithPopup(auth, provider)
}

const signOutHnadler = () => signOut(auth);



function App() {
  const [user, setUser] = useState(false);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);

  const divForScroll = useRef(null);

  const submitHandler = async (e) => {
    e.preventDefault();

    try {
      setMessage("");
      await addDoc(collection(db, "Messages"), {
        text: message,
        uid: user.uid,
        uri: user.photoURL,
        createdAt: serverTimestamp()
      })

      divForScroll.current.scrollIntoView({ behavior: "smooth" })
    } catch (error) {
      alert(error)
    }
  }

  useEffect(() => {
    const queryForSorting = query(collection(db, "Messages"), orderBy("createdAt", "asc"))
    const unsubscirbe = onAuthStateChanged(auth, (data) => {
      setUser(data)
    });

    const unsubForMessages = onSnapshot(queryForSorting, (snap) => {
      setMessages(
        snap.docs.map((item) => {
          const id = item.id;
          return { id, ...item.data() };
        })
      )
    })

    return () => {
      unsubscirbe();
      unsubForMessages();
    }
  }, [])

  return (
    <Box bg={"red.50"}>
      {
        user ? (
          <Container h={"100vh"} bg={"white"}>
            <VStack h="full" paddingY={"4"}>
              <Button
                w={"full"}
                colorScheme={"red"}
                onClick={signOutHnadler}
              >
                Logout
              </Button>

              <VStack
                h={"full"}
                w={"full"}
                overflowY={"auto"}
                css={{
                  "&::webkit-scrollbar": {
                    display: "none"
                  }
                }}
              >

                {
                  messages.map(item => (
                    <Message
                      key={item.id}
                      text={item.text}
                      uri={item.uri}
                      user={item.uid === user.uid ? "me" : "other"}
                    />
                  ))
                }

                <div ref={divForScroll}></div>
              </VStack>


              <form onSubmit={submitHandler} style={{ width: "100%" }}>
                <HStack>
                  <Input
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Enter a Message..."
                  />
                  <Button colorScheme={"purple"} type="submit">Send</Button>
                </HStack>
              </form>

            </VStack>

          </Container>
        ) :
          <VStack h={"100vh"} justifyContent={"center"} alignItems={"center"}>
            <Button
              onClick={loginHandler}
              colorScheme="purple"
            >
              Sign in with Google
            </Button>
          </VStack>
      }
    </Box>
  );
}

export default App;
