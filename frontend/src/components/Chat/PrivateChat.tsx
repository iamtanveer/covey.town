import React, { useEffect, useState } from 'react';
import {
    Box,
    Button,
    Checkbox,
    Flex,
    FormControl,
    FormLabel,
    Heading,
    Input,
    Stack,
    Table,
    TableCaption,
    Tbody,
    Td,
    Th,
    Thead,
    Tr,
    useToast
} from '@chakra-ui/react';
import { nanoid } from 'nanoid';

import Client from 'twilio-chat';
import { Channel } from 'twilio-chat/lib/channel';
import Player from '../../classes/Player';

import useCoveyAppState from '../../hooks/useCoveyAppState';


interface PrivateChatProps {
    updateChannelMap: (newChannelId:string,playerId:string) => void
}

interface PrivateMessageBody {
    author: string,
    dateCreated: any,
    body: string,
}

export default function PrivateChatWindow({ updateChannelMap }: PrivateChatProps): JSX.Element {



    const { videoToken, broadcastChannelSID, players, privateChannelSid, privateChannelMap, apiClient,currentTownID,myPlayerID } = useCoveyAppState();

    const [client, setClient] = useState<Client>();
    const [messages, setMessages] = useState<PrivateMessageBody[]>([]);

    const [channel, setChannel] = useState<Channel>();

    const [message, setMessage] = useState<string>('');


    useEffect(() => {
        console.log('use effect being called')
        Client.create(videoToken).then(newClient => {
            setClient(newClient)

        }
        )
        return () => {
            console.log("chat component is unmounted")
        }
    }, [videoToken, broadcastChannelSID])

    useEffect(() => {
        client?.getChannelBySid(privateChannelSid).then(newPrivateChannel => newPrivateChannel.join().then(joinedChannel => joinedChannel.on('messageAdded', (newMessage) => {
            console.log(`Author: + ${newMessage.author}`);
            console.log(`message:' + ${newMessage.body}`);
            console.log('new private channel sid: ', newPrivateChannel);

        })))
    }, [privateChannelSid])

    useEffect(() => {
        channel?.getMessages().then((paginator) => {
            const texts: PrivateMessageBody[] = [];
            for (let i = 0; i < paginator.items.length; i+=1) {
                const { author, body, dateCreated } = paginator.items[i];
                console.log('author: ', author, ' body: ', body, ' dateCreated: ', dateCreated);
                texts.push({ author, body, dateCreated });
            }
            setMessages(texts);
        });
    }, [channel])


    const handleMessage = async (playerId: string) => {
        let privateChannel = privateChannelMap.get(playerId);
        if (privateChannel === undefined) { 
            const response = await apiClient.createPrivateChannel({
                coveyTownID: currentTownID,
                userID : playerId,
                myUserID: myPlayerID
            })
            privateChannel = response.channelSid
            console.log('private channel sid: ', privateChannel);
            updateChannelMap(privateChannel,playerId);
            client?.getChannelBySid(privateChannel).then(newPrivateChannel => {
                setChannel(newPrivateChannel);
                newPrivateChannel.join().then(joinedChannel => joinedChannel.on('messageAdded', (newMessage) => {
                console.log(`Author: + ${newMessage.author}`);
                console.log(`message:' + ${newMessage.body}`);
    
            }))})
        } else {
            setChannel(await client?.getChannelBySid(privateChannel));
        }
    }

    const handleSendMessage = async () => {
        console.log('handling send messages');
        await channel?.sendMessage(message);
        setMessage('');
    }

    return <div>
        <form>
            <Stack>
                <Box p="4" borderWidth="1px" borderRadius="lg">

                    <FormControl>
                        <FormLabel htmlFor="message">Message</FormLabel>
                        <Input autoFocus name="message" placeholder="Your message"
                            value={message}
                            onChange={event => setMessage(event.target.value)}
                        />
                        <Button onClick={handleSendMessage}>Message</Button>
                    </FormControl>
                </Box>
            </Stack>
            <Table>
                <TableCaption placement="bottom">Publicly Listed Towns</TableCaption>
                <Thead><Tr><Th>User Name</Th></Tr></Thead>
                <Tbody>
                    {players?.map((player) => (
                        <Tr key={player.id}><Td role='cell'>{player.userName}</Td>
                            <Button onClick={() => handleMessage(player.id)}>Message</Button></Tr>
                    ))}
                </Tbody>
            </Table>
        </form>
    </div>
}