import React, { useEffect, useState, useRef } from 'react';
import {
    Container,
    Box,
    Grid,
    Text,
    List,
    ListItem,
    Select,
    SimpleGrid,
    InputGroup,
    Input,
    InputRightElement,
    Button,
    Stack,
} from '@chakra-ui/react';

import { ArrowRightIcon } from '@chakra-ui/icons';
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

export default function PrivateChatWindow({ updateChannelMap }: PrivateChatProps): JSX.Element {

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
        authors: { fontSize: 12, color: "black" }
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
        console.log('player id : ', playerId);
        let privateChannel = privateChannelMap.get(playerId);
        // console.log('map', privateChannelMap)
        if (privateChannel === undefined) {
            console.log(currentTownID, ' ', playerId, ' ', myPlayerID);
            const response = await apiClient.createPrivateChannel({
                coveyTownID: currentTownID,
                userID: playerId,
                requestorUserID: myPlayerID
            })
            privateChannel = response.channelSid;
            updateChannelMap(privateChannel, playerId);
            // console.log('got channel from backend')
            const newPrivateChannel = await client?.getChannelBySid(privateChannel);
            // console.log('got channel from client')
            const joinedChannel = await newPrivateChannel?.join();
            // console.log('joined channel')
            joinedChannel?.on('messageAdded', updateMessages);
            setCurrentChannel(joinedChannel);
        } else {
            const newChannel = await client?.getChannelBySid(privateChannel);
            // console.log('got channel from map')
            setCurrentChannel(newChannel);
        }
        // console.log('setting current player')
        const player = players.find((p) => p.id === playerId);
        setCurrentPlayer(player?.userName || '');
        setCurrentPlayersMessage( currentPlayerMessages.current.set(playerId,0));
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
        <Container  component="main">
            <SimpleGrid rows={2} spacing={3}>
                <Box>
                    <Select placeholder='Select player' onChange={(event) => handleMessage(event.target.value)}>
                        {players?.filter(p => p.id !==myPlayerID).map((player) => (
                            <option key={player.id} value={player.id}>{player.userName} ({playersMessages?.get(player.id)})</option>
                        ))}
                    </Select>
                </Box>
                <Box>
                    <Text position="static" fontSize="xl" color="black.500" isTruncated>
                        {currentPlayer}
                    </Text>
                </Box>
            </SimpleGrid>
            <Box>
                <SimpleGrid rows={2} spacing={2}>
                    <Box borderWidth={1}>
                        <Grid overflow="auto" height="70vh">
                            <List dense>
                                {messages &&
                                    messages.map((text) => (
                                        <ListItem key={nanoid()} style={styles.listItem(text.id === myPlayerID)}>
                                            <div style={styles.authors}>{text.authorName}</div>
                                            <div style={styles.container(text.id === myPlayerID)}>
                                                {text.body}
                                                <Box fontSize={8} color="white" textAlign="right" paddingTop={4}>
                                                    {new Date(text.dateCreated.toISOString()).toLocaleString()}
                                                </Box>
                                            </div>
                                        </ListItem>
                                    ))}
                            </List>
                        </Grid>
                    </Box>
                    <Box>
                        <SimpleGrid>
                            <Box>
                                <InputGroup size="md">
                                    <Input
                                        id="broadcastchatfield"
                                        required
                                        size="md"
                                        resize="horizontal"
                                        placeholder="Enter message"
                                        value={message}
                                        multiline
                                        rows={2}
                                        onChange={handleMessageChange}
                                    />
                                    <InputRightElement width="4.5rem">
                                        <Button h="1.75rem" size="sm" onClick={handleSendMessage}>
                                            <ArrowRightIcon
                                                w={8} h={8} color="#3f51b5" />
                                        </Button>
                                    </InputRightElement>
                                </InputGroup>
                            </Box>
                        </SimpleGrid>
                    </Box>
                </SimpleGrid>
            </Box>
        </Container>
    );
}
