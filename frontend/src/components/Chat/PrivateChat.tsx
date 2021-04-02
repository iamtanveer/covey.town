import React, {useEffect, useState} from 'react';
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

import {
  AppBar,
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
  Typography,
} from "@material-ui/core";
import {Send} from "@material-ui/icons";
import {Message} from 'twilio-chat/lib/message';


import {nanoid} from 'nanoid';

import Client from 'twilio-chat';
import {Channel} from 'twilio-chat/lib/channel';
import Player from '../../classes/Player';

import useCoveyAppState from '../../hooks/useCoveyAppState';


interface PrivateChatProps {
  updateChannelMap: (newChannelId: string, playerId: string) => void
}

interface PrivateMessageBody {
  id: string,
  authorName: string,
  dateCreated: any,
  body: string,
}

const useStyles = makeStyles(() => ({
  textField: {width: "100%", borderWidth: 0, borderColor: "transparent"},
  textFieldContainer: {flex: 1, marginRight: 12},
  gridItem: {paddingTop: 12, paddingBottom: 12},
  gridItemChatList: {overflow: "auto", height: "70vh"},
  gridItemMessage: {marginTop: 12, marginBottom: 12},
  sendButton: {backgroundColor: "#3f51b5"},
  sendIcon: {color: "white"},
  mainGrid: {paddingTop: 100, borderWidth: 1},
  authors: {fontSize: 10, color: "gray"},
  timestamp: {fontSize: 8, color: "white", textAlign: "right", paddingTop: 4},
}));


export default function PrivateChatWindow({updateChannelMap}: PrivateChatProps): JSX.Element {

  const {
    textField, textFieldContainer, gridItem, gridItemChatList, gridItemMessage, sendButton, sendIcon, mainGrid,
    authors, timestamp
  } = useStyles();

  const {
    videoToken,
    broadcastChannelSID,
    players,
    privateChannelSid,
    privateChannelMap,
    apiClient,
    currentTownID,
    myPlayerID
  } = useCoveyAppState();

  const [client, setClient] = useState<Client>();
  const [messages, setMessages] = useState<PrivateMessageBody[]>([]);

  const [channel, setChannel] = useState<Channel>();
  const [currentPlayer, setCurrentPlayer] = useState<string>('');

  const [message, setMessage] = useState<string>('');

  const setMessagesListener = (mes: PrivateMessageBody[]) => {
    console.log("Previous Messages, ", messages);
    console.log("Setting new messages");
    setMessages(mes);
    console.log("New Messages to be set: ", mes, messages);
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
    const player = players.find((p) => p.id === newMessage.author);
    messages.push({
      id: newMessage.author,
      authorName: player?.userName || '',
      body: newMessage.body,
      dateCreated: newMessage.dateCreated
    });
    setMessagesListener(messages);
    // setMessages(messages);
  }

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
      setChannel(joinedChannel);
      const player = players.find((p) => p.id === newMessage.author);
      setCurrentPlayer(player?.userName || '');
      console.log(`Author: + ${newMessage.author}`);
      console.log(`message:' + ${newMessage.body}`);
      console.log('new private channel sid: ', newPrivateChannel);
      updateMessages(newMessage);
    })))
  }, [privateChannelSid])

  useEffect(() => {
    console.log('Before get messages', messages);
    channel?.getMessages().then((paginator) => {
      const texts: PrivateMessageBody[] = [];
      console.log('we got messages', paginator.items);
      for (let i = 0; i < paginator.items.length; i += 1) {
        const {author, body, dateCreated} = paginator.items[i];
        console.log('author: ', author, ' body: ', body, ' dateCreated: ', dateCreated);
        const player = players.find((p) => p.id === author);
        texts.push({id: author, authorName: player?.userName || '', body, dateCreated});
      }
      setMessagesListener(texts)
      // setMessages(texts);
    });
    console.log('After get messages', messages);
  }, [channel])


  const handleMessage = async (playerId: string) => {
    let privateChannel = privateChannelMap.get(playerId);
    if (privateChannel === undefined) {
      console.log('Before create private channel');
      const response = await apiClient.createPrivateChannel({
        coveyTownID: currentTownID,
        userID: playerId,
        myUserID: myPlayerID
      })
      privateChannel = response.channelSid
      updateChannelMap(privateChannel, playerId);

      client?.getChannelBySid(privateChannel).then(newPrivateChannel => {
        setChannel(newPrivateChannel);
        newPrivateChannel.join().then(joinedChannel => {
          setChannel(newPrivateChannel);
          joinedChannel.on('messageAdded', (newMessage) => {
            console.log(`Author: + ${newMessage.author}`);
            console.log(`message:' + ${newMessage.body}`);
            console.log('inside event messageAdded');
            updateMessages(newMessage);
          })
        })
        console.log('after private channel join');
      })
    } else {
      const x = await client?.getChannelBySid(privateChannel)
      setChannel(x);
    }
    const player = players.find((p) => p.id === playerId);
    setCurrentPlayer(player?.userName || '');
  }

  const handleMessageChange = async (event: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) => {
    setMessage(event.target.value);
  }

  const handleSendMessage = async () => {
    console.log('handling send messages');
    await channel?.sendMessage(message);
    setMessage('');
  }

  return (
    <Container component="main" maxWidth="md">
      <CssBaseline/>
      <Grid container direction="column" className={mainGrid}>
        <Grid item>
          <AppBar position="static">
            <Typography variant="h6">
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
                <Send className={sendIcon}/>
              </IconButton>
            </Grid>
          </Grid>
        </Grid>
      </Grid>
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
  */
}
