import React, { useEffect } from 'react';
import { View, } from 'react-native';
import { WebView } from 'react-native-webview';
import BackButton from '../../components/BackButton';
import { trackScreenView } from '@/src/utils/analytics';

export default function VideoAskScreen() {

  useEffect(() => {
    trackScreenView('VideoAsk' , 'VideoAskScreen');
  }, []);

  return (
    <View style={{ flex: 1 }}>
       <BackButton/>
      <WebView
        source={{ uri: 'https://www.meditatewithabhi.com/feedbackaskforapp' }}
        style={{ flex: 1 }}
      />
    </View>
  );
}

