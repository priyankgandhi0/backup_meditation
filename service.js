import TrackPlayer from 'react-native-track-player';

module.exports = async function() {
  // When the remote play command is received.
  TrackPlayer.addEventListener('remote-play', () => {
    TrackPlayer.play();
  });

  // When the remote pause command is received.
  TrackPlayer.addEventListener('remote-pause', () => {
    TrackPlayer.pause();
  });

   // Handle the remote 'next' command. This will skip to the next track in the queue.
   TrackPlayer.addEventListener('remote-next', async () => {
    try {
      await TrackPlayer.skipToNext();
    } catch (error) {
      console.error('Error skipping to next track:', error);
    }
  });

  // Optionally, add additional event listeners (such as 'remote-previous')
  TrackPlayer.addEventListener('remote-previous', async () => {
    try {
      await TrackPlayer.skipToPrevious();
    } catch (error) {
      console.error('Error skipping to previous track:', error);
    }
  });
};