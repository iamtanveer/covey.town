import React, { useCallback, useEffect, useState, useRef } from 'react';

import {
    Container,
    Box,
    Grid,
    List,
    ListItem,
    SimpleGrid,
    InputGroup,
    Input,
    InputRightElement,
    Button,
} from '@chakra-ui/react';

import { ArrowRightIcon } from '@chakra-ui/icons';
import { nanoid } from 'nanoid';
import Client from 'twilio-chat';
import { Message } from 'twilio-chat/lib/message';
import { Channel } from 'twilio-chat/lib/channel';
import useCoveyAppState from '../../hooks/useCoveyAppState';
import useMaybeVideo from '../../hooks/useMaybeVideo';
import Player from '../../classes/Player';

export default function ChatWindow(): JSX.Element {
    const { players, videoToken, broadcastChannelSID, myPlayerID } = useCoveyAppState();
    const [channel, setChannel] = useState<Channel>();
    const [message, setMessage] = useState<string>('');
    const [messages, setMessages] = useState<{id: string, author: string, body: string, dateCreated: Date}[]>([]);
    const video = useMaybeVideo();
    const scrollDiv = useRef<HTMLDivElement>(null);
    const [townPlayers, setTownPlayers] = useState<Player[]>(players);
    const currenttownPlayers = useRef(townPlayers);
    const setCurrentTownPlayers = (val: Player[]) => {
        currenttownPlayers.current = val;
        setTownPlayers(val);
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

    const scrollToBottom = () => {
        if(scrollDiv.current){
            const maxScrollTop = scrollDiv.current.scrollHeight - scrollDiv.current.clientHeight;
            scrollDiv.current.scrollTop = maxScrollTop > 0 ? maxScrollTop : 0;
      }
    };

    useEffect(()=>{
        setCurrentTownPlayers(players)
    },[players])

    const joinChannel = useCallback(() => {
        const updateMessages = (newMessage: Message) => {
            const player = currenttownPlayers.current.find((p) => p.id === newMessage.author);
            setMessages(prevMessages => [...prevMessages, { id: newMessage.author, author: player?.userName || '', body: newMessage.body, dateCreated: newMessage.dateCreated }])
            scrollToBottom();
        }
        if(!channel) {
            Client.create(videoToken).then(newClient => {
                newClient.getChannelBySid(broadcastChannelSID).then(broadcastChannel => {
                    setChannel(broadcastChannel)
                    broadcastChannel.join().then(joinedChannel => joinedChannel.on('messageAdded', updateMessages))
                })
            })
        }
    }, [videoToken, broadcastChannelSID, channel])

    useEffect(() => {
        joinChannel()
    }, [joinChannel])

    const handleKeyDown = () => {
        video?.pauseGame()
    }

    const handleKeyUp = () => {
        video?.unPauseGame()
    }

    const handleMessageChange = async (event: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) => {
        setMessage(event.target.value);
    }

    const handleMessage = async () => {
        if (message.trimEnd() !== '') {
            channel?.sendMessage(message).then(() => setMessage(''))
        }
    }

    const handleEnterPress = (event: { which: number; }) => {
        if (event.which === 13) {
            handleMessage();
        }
    }

    return (
        <Container component="main">
            <Box>
                <SimpleGrid rows={2} spacing={2}>
                    <Box borderWidth={1}>
                        <Grid overflow="auto" height="70vh" ref={scrollDiv}>
                            <List dense>
                                {messages &&
                                    messages.map((text) => (
                                        <ListItem key={nanoid()} style={styles.listItem(text.id === myPlayerID)}>
                                            <div style={styles.authors}>{text.author}</div>
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
                                        autoComplete="off"
                                        onChange={handleMessageChange}
                                        onFocus={handleKeyDown}
                                        onBlur={handleKeyUp}
                                        onKeyPress={handleEnterPress}
                                    />
                                    <InputRightElement width="4.5rem">
                                        <Button h="1.75rem" size="sm" onClick={handleMessage}>
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
