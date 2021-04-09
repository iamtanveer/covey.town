import React, { useEffect, useState } from 'react';
import { Stack, Button, Box, Grid, FormControl, Select, MenuItem } from "@chakra-ui/react";
import ChatWindow from '../Chat/chat';
import PrivateChatWindow from "../Chat/PrivateChat";

interface PrivateChatProps {
  updatePrivateChannelMap: (newChannelId: string, playerId: string) => void;
}

export default function MenuBar({ updatePrivateChannelMap }: PrivateChatProps): JSX.Element {

    const [broadcastFlag, setBroadcastFlag] = useState<boolean>(true);
    const [groupFlag, setGroupFlag] = useState<boolean>(false);
    const [privateFlag, setPrivateFlag] = useState<boolean>(false);
    const [messageType, setMessageType] = useState<string>('');


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
        <Grid>
            <Grid direction="row" spacing={4} align="center" item>
                <Select onChange={(event) => handleMenuChange(event.target.value)}>
                    <option value="Broadcast Chat" selected>Broadcast Chat</option>
                    <option value="Group Chat">Group Chat</option>
                    <option value="Private Chat">Private Chat</option>
                </Select>
            </Grid>
            <Grid item>
                {broadcastFlag ? (
                    <Box>
                        <ChatWindow />
                    </Box>
                ) : null}
                {groupFlag ? (
                    <Box>
                        Hello Group
                    </Box>
                ) : null}
                {privateFlag ? (
                    <Box>
                      <PrivateChatWindow updateChannelMap={updatePrivateChannelMap} />
                    </Box>
                ) : null}
            </Grid>
        </Grid>
    )

}
