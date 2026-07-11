import React from 'react';
import Lottie from 'lottie-react';
import idleAnimation from '../../assets/ai-avatar-idle.json';
import speakingAnimation from '../../assets/ai-avatar-speaking.json';
import thinkingAnimation from '../../assets/ai-avatar-thinking.json';

/**
 * AIAvatar component renders a Lottie animation based on the avatar state.
 * Props:
 *  - state: 'idle' | 'speaking' | 'thinking'
 * The component is abstracted so it can later be replaced with a video avatar.
 */
const AIAvatar = ({ state = 'idle' }) => {
  let animationData = idleAnimation;
  if (state === 'speaking') animationData = speakingAnimation;
  else if (state === 'thinking') animationData = thinkingAnimation;

  return (
    <div className="ai-avatar">
      <Lottie animationData={animationData} loop={state === 'idle'} />
    </div>
  );
};

export default AIAvatar;
