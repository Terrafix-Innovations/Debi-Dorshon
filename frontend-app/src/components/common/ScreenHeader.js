import React from 'react';
import HeaderNavbar from './HeaderNavbar';

export default function ScreenHeader({ navigation, showBack = false, title = 'দেবী দর্শন' }) {
  return <HeaderNavbar navigation={navigation} showBack={showBack} title={title} />;
}
