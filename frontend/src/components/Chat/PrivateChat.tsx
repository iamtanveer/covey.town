import React, { useEffect, useState, useRef } from 'react';
import {
    Box,
    Button,
    Table,
    TableCaption,
    Tbody,
    Td,
    Th,
    Thead,
    Tr} from '@chakra-ui/react';

import {
    AppBar,
    Container,
    CssBaseline,
    Grid,
    IconButton,
    List,
    ListItem,
    makeStyles,
    TextField,
    Typography,
} from "@material-ui/core";
import { Send } from "@material-ui/icons";
import { Message } from 'twilio-chat/lib/message';


import { nanoid } from 'nanoid';

import Client from 'twilio-chat';
import { Channel } from 'twilio-chat/lib/channel';
import Player from '../../classes/Player';

import useCoveyAppState from '../../hooks/useCoveyAppState';





interface PrivateChatProps {
    updateChannelMap: (newChannelId: string, playerId: string) => void
}

interface PrivateMessageBody {
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


export default function PrivateChatWindow({ updateChannelMap }: PrivateChatProps): JSX.Element {

    const { textField, textFieldContainer, gridItemChatList, gridItemMessage, sendButton, sendIcon, mainGrid,
        authors, timestamp } = useStyles();

    const { videoToken, players, privateChannelSid, privateChannelMap, apiClient, currentTownID, myPlayerID } = useCoveyAppState();

    const [client, setClient] = useState<Client>();
    const [messages, setMessages] = useState<PrivateMessageBody[]>([]);

    const [channel, setChannel] = useState<Channel>();
    const currentChannel = useRef(channel);
    const setCurrentChannel = (val: Channel | undefined) => {
        currentChannel.current = val;
        setChannel(val);
    }

    const [currentPlayer, setCurrentPlayer] = useState<string>('');

    const [message, setMessage] = useState<string>('');



    const [playersMessages, setPlayersMessage] = useState<Map<string, number>>(new Map())
    const currentPlayerMessages = useRef(playersMessages);
    const setCurrentPlayersMessage = (val: Map<string, number>) => {
        currentPlayerMessages.current = val;
        setPlayersMessage(val);
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
        if (currentChannel.current?.sid === newMessage.channel.sid) {
            const player = players.find((p) => p.id === newMessage.author);
            setMessages(prevMessages => [...prevMessages, { id: newMessage.author, authorName: player?.userName || '', body: newMessage.body, dateCreated: newMessage.dateCreated }])
        } else {
            const msgCount = currentPlayerMessages.current.get(newMessage.author) || 0
            setCurrentPlayersMessage( currentPlayerMessages.current.set(newMessage.author,msgCount+1))
        }
    }

    useEffect(() => {
        // console.log('use effect being called')
        Client.create(videoToken).then(newClient => {
            setClient(newClient)
        })
        const initialPlayerMessages: Map<string, number> = new Map()
        players.forEach(p=>{
            initialPlayerMessages.set(p.id,0)
        })
        setCurrentPlayersMessage(initialPlayerMessages)
    }, [videoToken])

    useEffect(() => {
        players.forEach(p => {
            if (playersMessages?.get(p.id) === undefined) {
                playersMessages?.set(p.id, 0)
            }
        })
        setCurrentPlayersMessage(playersMessages)
    }, [players, playersMessages])

    useEffect(() => {
        // console.log('new Message request')
        // console.log('map', privateChannelMap)
        client?.getChannelBySid(privateChannelSid).then(newPrivateChannel => newPrivateChannel.join().then(joinedChannel => {
            // console.log('joined new message request channel')
            joinedChannel.on('messageAdded', updateMessages)
        }))

    }, [privateChannelSid])

    useEffect(() => {
        // console.log('getting messages')
        channel?.getMessages().then(
            (paginator) => {
                // console.log('got messages')
                const texts: PrivateMessageBody[] = [];
                for (let i = 0; i < paginator.items.length; i += 1) {
                    const { author, body, dateCreated } = paginator.items[i];
                    const player = players.find((p) => p.id === author);
                    texts.push({ id: author, authorName: player?.userName || '', body, dateCreated });
                }
                setMessages(texts);
            }
        )
    }, [channel])

    const handleMessage = async (playerId: string) => {
        let privateChannel = privateChannelMap.get(playerId);
        // console.log('map', privateChannelMap)
        if (privateChannel === undefined) {
            const response = await apiClient.createPrivateChannel({
                coveyTownID: currentTownID,
                userID: playerId,
                requestorUserID: myPlayerID
            })
            privateChannel = response.channelSid
            updateChannelMap(privateChannel, playerId);
            // console.log('got channel from backend')
            const newPrivateChannel = await client?.getChannelBySid(privateChannel)
            // console.log('got channel from client')
            const joinedChannel = await newPrivateChannel?.join()
            // console.log('joined channel')
            joinedChannel?.on('messageAdded', updateMessages)
            setCurrentChannel(joinedChannel)
        } else {
            const newChannel = await client?.getChannelBySid(privateChannel)
            // console.log('got channel from map')
            setCurrentChannel(newChannel);
        }
        // console.log('setting current player')
        const player = players.find((p) => p.id === playerId);
        setCurrentPlayer(player?.userName || '');
        setCurrentPlayersMessage( currentPlayerMessages.current.set(playerId,0))
    }

    const handleMessageChange = async (event: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) => {
        setMessage(event.target.value);
    }

    const handleSendMessage = async () => {
        // console.log('handling send messages');
        await channel?.sendMessage(message);
        setMessage('');
    }

    return (
        <Container  component="main" maxWidth="md">
            <CssBaseline />
            <Grid container direction="column" className={mainGrid}>
                <Grid item>
                    <AppBar position="static">
                        <Typography variant="h6" >
                            {currentPlayer}
                        </Typography>
                    </AppBar>
                </Grid>
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
                                onChange={handleMessageChange}
                            />
                        </Grid>

                        <Grid item>
                            <IconButton
                                className={sendButton}
                                onClick={handleSendMessage}>
                                <Send className={sendIcon} />
                            </IconButton>
                        </Grid>
                    </Grid>
                </Grid>
            </Grid>
            <Table>
                <TableCaption placement="bottom">Publicly Listed Towns</TableCaption>
                <Thead><Tr><Th>User Name</Th></Tr></Thead>
                <Tbody>
                    {players?.filter(p => p.id !==myPlayerID).map((player) => (
                        <Tr key={player.id}><Td role='cell'>{player.userName}</Td>
                        <Button onClick={() => handleMessage(player.id)}>Message ({playersMessages?.get(player.id)})</Button></Tr>
                    ))}
                </Tbody>
            </Table>
        </Container>
    );


    /*
    <div>
        <form>
            <Stack>
                <Box p="4" borderWidth="1px" borderRadius="lg">

                    <FormControl>
                        <FormLabel htmlFor="message">Message</FormLabel>
                        <Input autoFocus name="message" placeholder="Your message"
                            value={message}
                            onChange={event => setMessage(event.target.value)}
                        />
                    </FormControl>
                    <Button onClick={handleMessage}>Send</Button>
                </Box>
            </Stack>
            <Table>
                <TableCaption placement="bottom">Publicly Listed Towns</TableCaption>
                <Thead><Tr><Th>User Name</Th></Tr></Thead>
                <Tbody>
                  {players?.map((player) => (
                    <Tr key={player.id}><Td role='cell'>{player.userName}</Td>
                        <Button onClick={() => console.log("message")}>Message</Button></Tr>
                  ))}
                </Tbody>
              </Table>
        </form>
    </div>
     */
}
