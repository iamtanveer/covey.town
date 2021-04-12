import React, { useEffect, useState } from 'react';
import { Stack, Button, Box, Grid, FormControl, Select, MenuItem, SimpleGrid } from "@chakra-ui/react";
import ChatWindow from '../Chat/chat';
import PrivateChatWindow from "../Chat/PrivateChat";
import useCoveyAppState from '../../hooks/useCoveyAppState';

interface PrivateChatProps {
    updatePrivateChannelMap: (newChannelId: string, playerId: string) => void;
}

export default function MenuBar({ updatePrivateChannelMap }: PrivateChatProps): JSX.Element {



    const [broadcastFlag, setBroadcastFlag] = useState<boolean>(true);
    const [groupFlag, setGroupFlag] = useState<boolean>(false);
    const [privateFlag, setPrivateFlag] = useState<boolean>(false);
    const [messageType, setMessageType] = useState<string>('');

    const [joinBroadCast, setJoinBroadcast] = useState<boolean>(true);

    const handleMenuChange = (chatType: string) => {
        console.log(`Inside ${chatType} component!!`);
        switch (chatType) {
            case 'Broadcast Chat':
                setBroadcastFlag(true);
                setGroupFlag(false);
                setPrivateFlag(false);
                break;
            case 'Group Chat':
                setBroadcastFlag(false);
                setGroupFlag(true);
                setPrivateFlag(false);
                setJoinBroadcast(false)
                break;
            case 'Private Chat':
                setBroadcastFlag(false);
                setGroupFlag(false);
                setPrivateFlag(true);
                setJoinBroadcast(false)
                break;
            default:
                setBroadcastFlag(false);
                setGroupFlag(false);
                setPrivateFlag(false);
        }
    }

    return (
        <SimpleGrid rows={2} spacing={5}>
            <Box>
                <Select onChange={(event) => handleMenuChange(event.target.value)}>
                    <option value="Broadcast Chat" selected>Broadcast Chat</option>
                    <option value="Group Chat">Group Chat</option>
                    <option value="Private Chat">Private Chat</option>
                </Select>
            </Box>
            <Box>
                <Box hidden={!broadcastFlag}>
                    <ChatWindow />
                </Box>
                <Box hidden={!groupFlag}>Hello Group</Box>
                <Box hidden={!privateFlag}>
                    <PrivateChatWindow updateChannelMap={updatePrivateChannelMap} />
                </Box>
            </Box>
        </SimpleGrid>
    )

}
