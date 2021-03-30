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
import useCoveyAppState from '../../hooks/useCoveyAppState';





interface ChatProps {
    token: string,
    broadCastChannelSID: string
}

export default function ChatWindow(): JSX.Element {



    const { videoToken, broadcastChannelSID } = useCoveyAppState();

    const [client, setClient] = useState<Client>();
    const [channel, setChannel] = useState<Channel>();

    const [message, setMessage] = useState<string>('');

    useEffect(() => {
        console.log('use effect being called')
        Client.create(videoToken).then(newClient => {
            setClient(newClient)
            newClient.getChannelBySid(broadcastChannelSID).then(broadcastChannel => {
                setChannel(broadcastChannel)
                broadcastChannel.join().then(joinedChannel => joinedChannel.on('messageAdded', (newMessage) => {
                    console.log(`Author: + ${newMessage.author}`);
                    console.log(`message:' + ${newMessage.body}`);

                }))
            }

            )
        }
        )
        return () => {
            console.log("chat component is unmounted")
          }
    }, [videoToken, broadcastChannelSID])


    const handleMessage = async () => {
        channel?.sendMessage(message).then(num => setMessage(''))
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
                    </FormControl>
                    <Button onClick={handleMessage}>Send</Button>
                </Box>
            </Stack>
        </form>
    </div>
}