import React, { createContext, useState, useContext, useEffect, FC, ReactNode } from 'react';
import { Audio, InterruptionModeAndroid, InterruptionModeIOS } from 'expo-av';
import debounce from 'lodash.debounce';
import { EFFECT_SOUNDS, FREQUENCY_AUDIO_TRACKS } from '../utils/JsonData';

type AudioEffectsContextType = {
  activeEffects: string[];
  activeFrequencies: string[];
  effectVolumes: { [key: string]: number };
  frequencyVolumes: { [key: string]: number };
  toggleEffect: (name: string) => Promise<void>;
  toggleFrequency: (name: string) => Promise<void>;
  changeEffectVolume: (name: string, volume: number) => void;
  changeFrequencyVolume: (name: string, volume: number) => void;
  stopSound:() => void
  startEffect:() => void
};

const AudioEffectsContext = createContext<AudioEffectsContextType | undefined>(undefined);

export const AudioEffectsProvider: FC<{children:ReactNode}> = ({ children }) => {
  const [effectSounds, setEffectSounds] = useState<{ [key: string]: Audio.Sound | null }>({});
  const [frequencySounds, setFrequencySounds] = useState<{ [key: string]: Audio.Sound | null }>({});
  const [activeEffects, setActiveEffects] = useState<string[]>([]);
  const [activeFrequencies, setActiveFrequencies] = useState<string[]>([]);
  const [effectVolumes, setEffectVolumes] = useState<{ [key: string]: number }>(
    Object.fromEntries(EFFECT_SOUNDS.map(effect => [effect.name, 0.5]))
  );
  const [frequencyVolumes, setFrequencyVolumes] = useState<{ [key: string]: number }>(
    Object.fromEntries(FREQUENCY_AUDIO_TRACKS.map(track => [track.name, 0.5]))
  );
  const [pausedEffects, setPausedEffects] = useState<string[]>([]);
  const [pausedFrequency, setPausedFrequency] = useState<string[]>([]);

  useEffect(() => {
    const setupAudio = async () => {
      await Audio.setAudioModeAsync({
        staysActiveInBackground: true,
        playsInSilentModeIOS: true,
        interruptionModeIOS: InterruptionModeIOS.DoNotMix,
        interruptionModeAndroid: InterruptionModeAndroid.DoNotMix,
        shouldDuckAndroid: false,
        playThroughEarpieceAndroid: false,
        allowsRecordingIOS: false,
      });
    };

    setupAudio();
  }, []);

  useEffect(() => {
    loadSounds();
    return () => {
      unloadSounds();
    };
  }, []);

  const loadSounds = async () => {
    const loadedEffectSounds: { [key: string]: Audio.Sound } = {};
    for (const effect of EFFECT_SOUNDS) {
      try {
        const { sound } = await Audio.Sound.createAsync(
          { uri: effect.url },
          { shouldPlay: false, volume: effectVolumes[effect.name], isLooping: true }
        );
        loadedEffectSounds[effect.name] = sound;
      } catch (error) {
        console.error(`Error loading effect sound ${effect.name}:`, error);
      }
    }
    setEffectSounds(loadedEffectSounds);

    const loadedFrequencySounds: { [key: string]: Audio.Sound } = {};
    for (const track of FREQUENCY_AUDIO_TRACKS) {
      try {
        const { sound } = await Audio.Sound.createAsync(
          { uri: track.url },
          { shouldPlay: false, volume: frequencyVolumes[track.name], isLooping: true }
        );
        loadedFrequencySounds[track.name] = sound;
      } catch (error) {
        console.error(`Error loading frequency sound ${track.name}:`, error);
      }
    }
    setFrequencySounds(loadedFrequencySounds);
  };

  const unloadSounds = () => {
    Object.values(effectSounds).forEach(sound => sound?.unloadAsync());
    Object.values(frequencySounds).forEach(sound => sound?.unloadAsync());
  };

  const toggleEffect = async (name: string) => {
    const sound = effectSounds[name];
    if (sound) {
      if (activeEffects.includes(name)) {
        await sound.stopAsync();
        setActiveEffects(prev => prev.filter(effect => effect !== name));
      } else {
        await sound.playAsync();
        setActiveEffects(prev => [...prev, name]);
      }
      if(pausedEffects.includes(name)){
      console.log('activeEffects',pausedEffects)
        setPausedEffects(prev => prev.filter(freq => freq !== name));
      } else {
        setPausedEffects(prev => [...prev, name]);
      }
    }
  };

  const toggleFrequency = async (name: string) => {
    const sound = frequencySounds[name];
    if (sound) {
      if (activeFrequencies.includes(name)) {
        await sound.stopAsync();
        setActiveFrequencies(prev => prev.filter(freq => freq !== name));
      } else {
        await sound.playAsync();
        setActiveFrequencies(prev => [...prev, name]);
      }
      if(pausedFrequency.includes(name)){
        setPausedFrequency(prev => prev.filter(freq => freq !== name));
      } else {
        setPausedFrequency(prev => [...prev, name]);
      }
    }
  };

  const debouncedChangeEffectVolume = debounce(async (name: string, volume: number) => {
    const sound = effectSounds[name];
    if (sound) {
      await sound.setVolumeAsync(volume);
    }
  }, 200);

  const debouncedChangeFrequencyVolume = debounce(async (name: string, volume: number) => {
    const sound = frequencySounds[name];
    if (sound) {
      await sound.setVolumeAsync(volume);
    }
  }, 200);

  const changeEffectVolume = (name: string, volume: number) => {
    setEffectVolumes(prev => ({ ...prev, [name]: volume }));
    debouncedChangeEffectVolume(name, volume);
  };

  const changeFrequencyVolume = (name: string, volume: number) => {
    setFrequencyVolumes(prev => ({ ...prev, [name]: volume }));
    debouncedChangeFrequencyVolume(name, volume);
  };

  const stopSound = async() => {
    for (const name of activeEffects) {
      const sound = effectSounds[name];
      if (sound) {
        try {
          await sound.stopAsync(); // Stop the sound
        } catch (error) {
          console.error(`Error stopping sound ${name}:`, error);
        }
      }
    }
    for (const name of pausedEffects) {
      const sound = effectSounds[name];
      if (sound) {
        try {
          await sound.stopAsync(); // Stop the sound
        } catch (error) {
          console.error(`Error stopping sound ${name}:`, error);
        }
      }
    }
    for (const name of pausedFrequency) {
      const sound = frequencySounds[name];
      if (sound) {
        try {
          await sound.stopAsync(); // Stop the sound
        } catch (error) {
          console.error(`Error stopping sound ${name}:`, error);
        }
      }
    }
    for (const name of activeFrequencies) {
      const sound = frequencySounds[name];
      if (sound) {
        try {
          await sound.stopAsync(); // Stop the sound
        } catch (error) {
          console.error(`Error stopping sound ${name}:`, error);
        }
      }
    }
    setActiveEffects([]); // Clear active effects
    setActiveFrequencies([])
  }

  // useEffect(() => {
  //   setPausedEffects(activeEffects.length === 0 ?  pausedEffects : activeEffects);
  //   setPausedFrequency(activeFrequencies.length === 0 ?  pausedFrequency : activeFrequencies);
  // },[activeEffects, activeFrequencies])

  const startEffect = async() => {
  for (const name of pausedEffects) {
    const sound = effectSounds[name];
    if (sound) {
      try {
        await sound.playAsync(); // Replay the sound
      } catch (error) {
        console.error(`Error replaying sound ${name}:`, error);
      }
    }
  }
  for (const name of pausedFrequency) {
    const sound = frequencySounds[name];
    if (sound) {
      try {
        await sound.playAsync(); // Replay the sound
      } catch (error) {
        console.error(`Error replaying sound ${name}:`, error);
      }
    }
  }
  setActiveEffects(pausedEffects); 
  setActiveFrequencies(pausedFrequency)
  }

  return (
    <AudioEffectsContext.Provider
      value={{
        activeEffects,
        activeFrequencies,
        effectVolumes,
        frequencyVolumes,
        toggleEffect,
        toggleFrequency,
        changeEffectVolume,
        changeFrequencyVolume,
        stopSound,
        startEffect
      }}
    >
      {children}
    </AudioEffectsContext.Provider>
  );
};

export const useAudioEffects = () => {
  const context = useContext(AudioEffectsContext);
  if (context === undefined) {
    throw new Error('useAudioEffects must be used within an AudioEffectsProvider');
  }
  return context;
};