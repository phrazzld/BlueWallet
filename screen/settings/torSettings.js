/* global alert */
import React, { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';

import navigationStyle from '../../components/navigationStyle';
import { BlueButton, BlueCard, BlueLoading, BlueSpacing20, BlueText, SafeBlueArea } from '../../BlueComponents';
import loc from '../../loc';
import { BlueCurrentTheme } from '../../components/themes';

const torrific = require('../../blue_modules/torrific');

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  uri: {
    flexDirection: 'row',
    borderColor: BlueCurrentTheme.colors.formBorder,
    borderBottomColor: BlueCurrentTheme.colors.formBorder,
    borderWidth: 1,
    borderBottomWidth: 0.5,
    backgroundColor: BlueCurrentTheme.colors.inputBackgroundColor,
    minHeight: 44,
    height: 44,
    alignItems: 'center',
    borderRadius: 4,
  },
  uriText: {
    flex: 1,
    color: '#81868e',
    marginHorizontal: 8,
    minHeight: 36,
    height: 36,
  },
  buttonStyle: {
    backgroundColor: 'transparent',
  },
  torSupported: {
    color: '#81868e',
  },
});

const TorSettings = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [daemonStatus, setDaemonStatus] = useState('');

  const updateStatus = async () => {
    const status = await torrific.getDaemonStatus();
    setDaemonStatus(status);
  };

  const startIfNotStarted = async () => {
    await torrific.startIfNotStarted();
  };

  const stopIfRunning = async () => {
    await torrific.stopIfRunning();
  };

  const testSocket = async () => {
    try {
      setIsLoading(true);
      await torrific.testSocket();
      alert('OK');
    } catch (error) {
      alert(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const testHttp = async () => {
    try {
      setIsLoading(true);
      await torrific.testHttp();
      alert('OK');
    } catch (error) {
      alert(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const interval = setInterval(updateStatus, 1000);
    return () => {
      clearInterval(interval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (isLoading) {
    return (
      <View style={[styles.root]}>
        <BlueLoading />
      </View>
    );
  }

  return (
    <SafeBlueArea forceInset={{ horizontal: 'always' }} style={styles.root}>
      <BlueCard>
        <BlueText>Daemon Status: {daemonStatus}</BlueText>
      </BlueCard>

      <BlueButton title="start" onPress={startIfNotStarted} />
      <BlueSpacing20 />
      <BlueButton title="stop" onPress={stopIfRunning} />
      <BlueSpacing20 />
      <BlueButton title="test socket" onPress={testSocket} />
      <BlueSpacing20 />
      <BlueButton title="test http" onPress={testHttp} />
    </SafeBlueArea>
  );
};

TorSettings.navigationOptions = navigationStyle({}, opts => ({ ...opts, title: loc.settings.tor_settings }));

export default TorSettings;
