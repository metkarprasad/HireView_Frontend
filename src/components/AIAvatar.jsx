import React from 'react';
import LottieModule from 'lottie-react';

// Handle CommonJS/ESM interop edge cases with lottie-react
const Lottie = LottieModule.default || LottieModule;
import idleAnimation from '../assets/ai-avatar-idle.json';
import speakingAnimation from '../assets/ai-avatar-speaking.json';
import thinkingAnimation from '../assets/ai-avatar-thinking.json';

/**
 * AIAvatar component renders a Lottie animation based on the avatar state.
 * Props:
 *  - state: 'idle' | 'speaking' | 'thinking'
 * The component is abstracted so it can later be replaced with a video avatar.
 */
const AIAvatar = ({ state = 'idle', avatarConfig = 'professional_male' }) => {
  let animationData = idleAnimation;
  if (state === 'speaking') animationData = speakingAnimation;
  else if (state === 'thinking') animationData = thinkingAnimation;

  // Apply a hue shift to distinguish between male and female avatars since we use the same base Lottie
  const filterStyle = avatarConfig.includes('female') ? { filter: 'hue-rotate(270deg) drop-shadow(0 4px 6px rgba(0,0,0,0.2))' } : { filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.2))' };

  return (
    <div className="ai-avatar transition-all duration-500" style={filterStyle}>
      <Lottie animationData={animationData} loop={state === 'idle'} />
    </div>
  );
};

export default AIAvatar;
