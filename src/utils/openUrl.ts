import { Linking, Alert } from 'react-native';

/**
 * Centralized external-link opener (item 31): only https is permitted, failures
 * are handled gracefully, and no raw browser errors reach the user.
 */
export async function openExternalUrl(rawUrl: string): Promise<boolean> {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    Alert.alert('Cannot open link', 'This link appears to be invalid.');
    return false;
  }
  if (url.protocol !== 'https:') {
    Alert.alert('Cannot open link', 'Only secure (https) links can be opened.');
    return false;
  }
  try {
    const supported = await Linking.canOpenURL(rawUrl);
    if (!supported) throw new Error('unsupported');
    await Linking.openURL(rawUrl);
    return true;
  } catch {
    Alert.alert('Cannot open link', 'Please try again later or visit the site directly.');
    return false;
  }
}
