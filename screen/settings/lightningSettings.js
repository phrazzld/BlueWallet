/* global alert */
import React, { useState, useEffect, useCallback } from 'react';
import { View, Linking, StyleSheet, Alert } from 'react-native';
import { Button } from 'react-native-elements';
import { useTheme, useRoute } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import navigationStyle from '../../components/navigationStyle';
import { BlueButton, BlueAddressInput, BlueCard, BlueLoading, BlueSpacing20, BlueText, SafeBlueArea } from '../../BlueComponents';
import { AppStorage } from '../../class';
import { LightningCustodianWallet } from '../../class/wallets/lightning-custodian-wallet';
import loc from '../../loc';
import DeeplinkSchemaMatch from '../../class/deeplink-schema-match';

const LightningSettings = () => {
  const params = useRoute().params;
  const [isLoading, setIsLoading] = useState(true);
  const [URI, setURI] = useState();
  const { colors } = useTheme();
  const route = useRoute();
  const stylesHook = StyleSheet.create({
    root: {
      backgroundColor: colors.background,
    },

    torSupported: {
      color: colors.feeText,
    },
  });

  useEffect(() => {
    AsyncStorage.getItem(AppStorage.LNDHUB)
      .then(setURI)
      .then(() => setIsLoading(false))
      .catch(() => setIsLoading(false));

    if (params?.url) {
      Alert.alert(
        loc.formatString(loc.settings.set_lndhub_as_default, { url: params?.url }),
        '',
        [
          {
            text: loc._.ok,
            onPress: () => {
              setLndhubURI(params?.url);
            },
            style: 'default',
          },
          { text: loc._.cancel, onPress: () => {}, style: 'cancel' },
        ],
        { cancelable: false },
      );
    }
  }, [params?.url]);

  const setLndhubURI = value => {
    if (DeeplinkSchemaMatch.getUrlFromSetLndhubUrlAction(value)) {
      // in case user scans a QR with a deeplink like `bluewallet:setlndhuburl?url=https%3A%2F%2Flndhub.herokuapp.com`
      value = DeeplinkSchemaMatch.getUrlFromSetLndhubUrlAction(value);
    }
    setURI(value.trim());
  };

  const save = useCallback(async () => {
    setIsLoading(true);
    try {
      if (URI) {
        await LightningCustodianWallet.isValidNodeAddress(URI);
        // validating only if its not empty. empty means use default
      }
      await AsyncStorage.setItem(AppStorage.LNDHUB, URI);
      alert(loc.settings.lightning_saved);
    } catch (error) {
      alert(loc.settings.lightning_error_lndhub_uri);
      console.log(error);
    }
    setIsLoading(false);
  }, [URI]);

  const resetToDefault = async () => {
    Alert.alert(loc.settings.electrum_reset_to_default, loc.settings.lnd_reset_to_default_message, [
      { text: loc._.cancel, onPress: () => console.log('Cancel Pressed'), style: 'cancel' },
      {
        text: loc._.ok,
        onPress: () => {
          setURI('');
          save();
        },
      },
    ]);
  };

  return (
    <SafeBlueArea forceInset={{ horizontal: 'always' }} style={[styles.root, stylesHook.root]}>
      <View style={[styles.root, stylesHook.root]}>
        <BlueCard>
          <BlueText>{loc.settings.lightning_settings_explain}</BlueText>
        </BlueCard>

        <Button
          icon={{
            name: 'github',
            type: 'font-awesome',
            color: colors.foregroundColor,
          }}
          onPress={() => Linking.openURL('https://github.com/BlueWallet/LndHub')}
          titleStyle={{ color: colors.buttonAlternativeTextColor }}
          title="github.com/BlueWallet/LndHub"
          color={colors.buttonTextColor}
          buttonStyle={styles.buttonStyle}
        />
        <BlueCard>
          <BlueAddressInput
            onChangeText={setLndhubURI}
            onBarScanned={setLndhubURI}
            address={URI}
            isLoading={isLoading}
            placeholder={LightningCustodianWallet.defaultBaseUri}
            autoCorrect={false}
            autoCapitalize="none"
            underlineColorAndroid="transparent"
            numberOfLines={1}
            launchedBy={route.name}
            marginHorizontal={0}
            marginVertical={0}
            textContentType="URL"
            showFileImportButton
          />
          <BlueText style={[styles.torSupported, stylesHook.torSupported]}>{loc.settings.tor_supported}</BlueText>
          <BlueSpacing20 />
          {isLoading ? <BlueLoading /> : <BlueButton onPress={save} disabled={(URI || '').trim().length === 0} title={loc.settings.save} />}
          <BlueSpacing20 />
          {!isLoading && <BlueButton title={loc.settings.electrum_reset} onPress={resetToDefault} />}
        </BlueCard>
      </View>
    </SafeBlueArea>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  buttonStyle: {
    backgroundColor: 'transparent',
  },
  torSupported: {
    marginTop: 20,
    textAlign: 'center',
  },
});

LightningSettings.navigationOptions = navigationStyle({}, opts => ({ ...opts, title: loc.settings.lightning_settings }));

export default LightningSettings;
