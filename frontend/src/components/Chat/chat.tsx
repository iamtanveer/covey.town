import React, { useEffect, useState,useRef } from 'react';

import {
  Backdrop,
  CircularProgress,
  Container,
  CssBaseline,
  Grid,
  IconButton,
  List,
  ListItem,
  makeStyles,
  TextField,
} from "@material-ui/core";
import { Send } from "@material-ui/icons";
import { Message } from 'twilio-chat/lib/message';

import { nanoid } from 'nanoid';
import Client from 'twilio-chat';
import { Channel } from 'twilio-chat/lib/channel';
import useCoveyAppState from '../../hooks/useCoveyAppState';

interface ChatProps {
   join:boolean
}

interface MessageBody {
    id: string,
    authorName: string,
    dateCreated: Date,
    body: string,
}

const useStyles = makeStyles(() => ({
  textField: { width: "100%", borderWidth: 0, borderColor: "transparent" },
  textFieldContainer: { flex: 1, marginRight: 12 },
  gridItem: { paddingTop: 12, paddingBottom: 12 },
  gridItemChatList: { overflow: "auto", height: "70vh" },
  gridItemMessage: { marginTop: 12, marginBottom: 12 },
  sendButton: { backgroundColor: "#3f51b5" },
  sendIcon: { color: "white" },
  mainGrid: { paddingTop: 100, borderWidth: 1 },
  authors: { fontSize: 10, color: "gray" },
  timestamp: { fontSize: 8, color: "white", textAlign: "right", paddingTop: 4 },
}));

export default function ChatWindow({join}:ChatProps): JSX.Element {
    const { textField, textFieldContainer, gridItem, gridItemChatList, gridItemMessage, sendButton, sendIcon, mainGrid, authors, timestamp } = useStyles();
    const { players, videoToken, broadcastChannelSID, myPlayerID } = useCoveyAppState();
    const [client, setClient] = useState<Client>();
    const [channel, setChannel] = useState<Channel>();
    const [message, setMessage] = useState<string>('');
    const [loading, setLoading] = useState<boolean>(false);
    const [messages, setMessages] = useState<MessageBody[]>([]);
    const currentMessages = useRef(messages);
    const setCurrentMessages = (val: MessageBody[]) => {
        currentMessages.current = val;
        setMessages(val);
    }

    const styles = {
        listItem: (isOwnMessage: boolean) => ({
            flexDirection: 'column' as const,
            alignItems: isOwnMessage ? "flex-end" : "flex-start",
        }),
        container: (isOwnMessage: boolean) => ({
            maxWidth: "75%",
            borderRadius: 12,
            padding: 16,
            color: "white",
            fontSize: 12,
            backgroundColor: isOwnMessage ? "#054740" : "#262d31",
        }),
    };

    const updateMessages = (newMessage: Message) => {
        console.log('add message called')
        const player = players.find((p) => p.id === newMessage.author);
        currentMessages.current.push({ id: newMessage.author, authorName: player?.userName || '', body: newMessage.body, dateCreated: newMessage.dateCreated })
        setCurrentMessages(currentMessages.current)

    }

    const getBroadcastMessages =  (c:Channel | undefined) =>{
        c?.getMessages().then(
            (paginator) => {
                // console.log('got messages')
                const texts: MessageBody[] = [];
                for (let i = 0; i < paginator.items.length; i += 1) {
                    const { author, body, dateCreated } = paginator.items[i];
                    const player = players.find((p) => p.id === author);
                    texts.push({ id: author, authorName: player?.userName || '', body, dateCreated });
                }
                setCurrentMessages(texts);
            }
        )
        
    }

    useEffect(() => {
        console.log('use effect being called')
        Client.create(videoToken).then(newClient => {
            setClient(newClient)
            newClient.getChannelBySid(broadcastChannelSID).then(broadcastChannel => {
                if(join){
                    broadcastChannel.join().then(joinedChannel => {
                        setChannel(broadcastChannel)
                    })
                } else {
                    setChannel(broadcastChannel)
                }
            }
            )
        }
        )
        return ()=>{
            const c = channel?.removeAllListeners('messageAdded')
            console.log('removed listener',c?.sid)
        }
    }, [videoToken, broadcastChannelSID])

    useEffect(()=>{
        channel?.on('messageAdded', updateMessages)
        getBroadcastMessages(channel)
    },[channel])

    const handleMessageChange = async (event: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) => {
        setMessage(event.target.value);
    }

    const handleMessage = async () => {
        channel?.sendMessage(message).then(num => setMessage(''))
    }

    return (
        <Container component="main" maxWidth="md">
            <Backdrop open={loading} style={{ zIndex: 99999 }}>
                <CircularProgress style={{ color: "white" }} />
            </Backdrop>

            <CssBaseline />

            <Grid container direction="column" className={mainGrid}>
                <Grid item className={gridItemChatList}>
                    <List dense>
                        {messages &&
                            messages.map((text) => (
                                <ListItem key={nanoid()} style={styles.listItem(text.id === myPlayerID)}>
                                    <div className={authors}>{text.authorName}</div>
                                    <div style={styles.container(text.id === myPlayerID)}>
                                    {text.body}
                                    <div className={timestamp}>
                                        {new Date(text.dateCreated.toISOString()).toLocaleString()}
                                    </div>
                                    </div>
                                </ListItem>
                            ))}
                    </List>
                </Grid>

                <Grid item className={gridItemMessage}>
                    <Grid
                        container
                        direction="row"
                        justify="center"
                        alignItems="center">
                        <Grid item className={textFieldContainer}>
                            <TextField
                                id="broadcastchatfield"
                                required
                                className={textField}
                                placeholder="Enter message"
                                variant="outlined"
                                value={message}
                                multiline
                                rows={2}
                                disabled={!channel}
                                onChange={handleMessageChange}
                            />
                        </Grid>

                        <Grid item>
                            <IconButton
                                className={sendButton}
                                onClick={handleMessage}
                                disabled={!channel}>
                                <Send className={sendIcon} />
                            </IconButton>
                        </Grid>
                    </Grid>
                </Grid>
            </Grid>
        </Container>
   );
}
