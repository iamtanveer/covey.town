import React, { useState } from 'react';
import { Box, Select, SimpleGrid } from "@chakra-ui/react";
import ChatWindow from '../Chat/chat';
import PrivateChatWindow from "../Chat/PrivateChat";
import GroupChatWindow from "../Chat/groupChat";

interface PrivateChatProps {
    updatePrivateChannelMap: (newChannelId: string, playerId: string) => void;
}

export default function MenuBar({ updatePrivateChannelMap }: PrivateChatProps): JSX.Element {
    const [broadcastFlag, setBroadcastFlag] = useState<boolean>(true);
    const [groupFlag, setGroupFlag] = useState<boolean>(false);
    const [privateFlag, setPrivateFlag] = useState<boolean>(false);

    const handleMenuChange = (chatType: string) => {
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
                break;
            case 'Private Chat':
                setBroadcastFlag(false);
                setGroupFlag(false);
                setPrivateFlag(true);
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
                <Select value = "Broadcast Chat" onChange={(event) => handleMenuChange(event.target.value)}>
                    <option value="Broadcast Chat">Broadcast Chat</option>
                    <option value="Group Chat">Group Chat</option>
                    <option value="Private Chat">Private Chat</option>
                </Select>
            </Box>
            <Box>
                <Box hidden={!broadcastFlag}>
                    <ChatWindow />
                </Box>

                <Box hidden={!groupFlag}>
                  <GroupChatWindow />
                </Box>

                <Box hidden={!privateFlag}>
                    <PrivateChatWindow updateChannelMap={updatePrivateChannelMap} />
                </Box>
            </Box>
        </SimpleGrid>
    )
}
