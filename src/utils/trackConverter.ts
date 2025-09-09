import { Track } from '.././context/AudioContext';
import { MusicTrack } from '../services/sounds.service';

export const convertMusicTrackToTrack = (musicTrack: MusicTrack): Track => {
  return {
    id: musicTrack._id,
    url: musicTrack.audioFilename,
    title: musicTrack.name,
    image:musicTrack.imageFilename
  };
};