/**
 * The video calling component of Covey.Town must implement this server interface,
 * which is used to authorize a client to connect to a video room.
 */
export default interface IVideoClient {
  /**
   * Issue a secret token on behalf of the video service that the client will be able to use
   * to connect to the video room specified.
   *
   * @param coveyTownID The town that the client should be able to connect to
   * @param clientIdentity The identity of the client; the video service will map a client
   *                      that connects with the returned token back to this client identifier
   */
  getTokenForTown(coveyTownID: string, clientIdentity: string): Promise<string>;

  /**
   * Creates a channel using a session token
   *
   * @param sessionToken The token required for creating the channel
   */
  createChannel(sessionToken: string): Promise<string>;

  /**
   * Takes a session token and a array of all the channels associated with the token and destroys the channel
   *
   * @param sessionToken The token required for creating the client and removing the channels linked to it
   * @param channels The list of channels associated with a specific token
   */
  deleteChannels(sessionToken: string, channels: Array<string>): Promise<void>;
}
