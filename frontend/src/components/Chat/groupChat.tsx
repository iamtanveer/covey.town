import React, { useEffect, useState } from 'react';
import { nanoid } from 'nanoid';
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
    Text,
} from '@chakra-ui/react';
import { ArrowRightIcon } from '@chakra-ui/icons';
import Client from 'twilio-chat';
import { Channel } from 'twilio-chat/lib/channel';
import { Message } from 'twilio-chat/lib/message';
import useCoveyAppState from '../../hooks/useCoveyAppState';
import useMaybeVideo from '../../hooks/useMaybeVideo';

export default function GroupChatWindow(): JSX.Element {
    const { players, videoToken, groupChatChannelSID, inGroupChatArea, myPlayerID } = useCoveyAppState();
    const [channel, setChannel] = useState<Channel>();
    const [message, setMessage] = useState<string>('');
    const [messages, setMessages] = useState<{id: string, author: string, body: string, dateCreated: Date}[]>([]);
    const video = useMaybeVideo()

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
        authors: { fontSize: 10, color: "gray" },
        info: { fontSize: 50, color: "tomato" }
    };

    useEffect(() => {
        Client.create(videoToken).then(newClient => {
            newClient.getChannelBySid(groupChatChannelSID).then(groupChannel=> setChannel(groupChannel))
        })
    }, [videoToken, groupChatChannelSID])

    useEffect(() => {
        const messageHandler = (newMessage: Message) => {
            const player = players.find((p) => p.id === newMessage.author);
            setMessages(prevMessages => [...prevMessages, {  id: newMessage.author,author:player?.userName||'',body: newMessage.body,dateCreated:newMessage.dateCreated}])
        }
        if (inGroupChatArea) {
            if(channel?.status !== 'joined') {
                channel?.join().then(joinedChannel => joinedChannel.on('messageAdded', messageHandler))
            }
        } else {
            channel?.removeAllListeners('messageAdded')
            channel?.leave()
            setMessages([])
        }
    }, [inGroupChatArea, channel, players])

    const handleMessageChange = async (event: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) => {
        setMessage(event.target.value);
    }

    const handleMessage = async () => {
        if (message.trimEnd() !== '') {
            channel?.sendMessage(message).then(() => setMessage(''))
        }
    }

    const handleKeyDown = () => {
        video?.pauseGame()
    }

    const handleKeyUp = () => {
        video?.unPauseGame()
    }

    return (
        <Container component="main">
            <Box hidden={inGroupChatArea} >
                <Text style={styles.info}>To join Group chat go to highlighted Group Chat area.</Text>
            </Box>
            <Box hidden={!inGroupChatArea}>
                <SimpleGrid rows={2} spacing={2}>
                    <Box borderWidth={1}>
                        <Grid overflow="auto" height="70vh">
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
                                        onChange={handleMessageChange}
                                        disabled={!inGroupChatArea}
                                        onFocus={handleKeyDown}
                                        onBlur={handleKeyUp}
                                    />
                                    <InputRightElement width="4.5rem">
                                        <Button h="1.75rem" size="sm" onClick={handleMessage} disabled={!inGroupChatArea}>
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
