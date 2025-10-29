
README.md # Visual-instrument

The Virtual Music Learning Platform is an interactive and accessible web-based application designed to make learning music fun and engaging. It allows users to control and play musical notes using hand gestures, with real-time sound and visual feedback through falling blocks.

Overview
It is a web-based system that combines hand gesture recognition and real-time sound generation to create an engaging, interactive way of learning music. Using MediaPipe Hands for gesture tracking and Tone.js for audio playback, users can play virtual instruments and receive visual feedback for rhythm and accuracy. The project demonstrates how technology and gamified learning can make music education more accessible, enjoyable, and immersive.

Features
*Hand Gesture Recognition: Uses MediaPipe Hands to detect real-time hand and finger movements.  
*Real-Time Sound Generation: Implements Tone.js to generate live sound for different instruments.  
*Falling Block Gameplay: Visual learning through colour-coded falling notes synced with rhythm.  
*Practice and Autoplay Modes: Users can either play notes manually or watch the system demonstrate them.  
*Multiple Instrument Options: Switch between piano, guitar, violin, or trumpet.  
*Visual Feedback: Displays rhythm accuracy, score, and combo multipliers.  
*Responsive Interface: Works across devices with an intuitive and colourful design.  
*Accessible Controls: Includes toggles for camera, layout flip, volume, and tempo settings.
*User-friendly hand layout

Programming Languages / Technology Stack
*Frontend: HTML5, CSS3, JavaScript (ES6) 
*Libraries & Frameworks: MediaPipe Hands, Tone.js, p5.js 
*Tools: Windsurf, GitHub, Live Server 

Implementation Highlights
*Integrated MediaPipe Hands API to track hand landmarks and map gestures to musical notes.  
*Designed Tone.js synthesisers for multiple instrument sounds with low-latency playback.  
*Created a real-time falling block system for note timing and accuracy scoring.  
*Implemented two learning modes:
*Practice Mode: Step-by-step learning with highlighted note prompts.  
*Autoplay Mode: Automatic playback of songs for visual learning.  
*Optimised for browser performance and gesture recognition accuracy.  
*Enhanced user experience through responsive layout and intuitive colour-coded feedback.
*Multi-zone hit detection (Perfect/Great/Good/Miss)
*LocalStorage for user preferences (left-hand mode)

Manual Instruction
*Run index.html(homepage) in a modern browser or access the website link：https://shirley-yuxia.github.io/Visual-instrument/

Gesture Piano-Application 1
*Camera automatically turns on and is ready to detect hand gestures
*Personalize the control panel based on user preferences(Select a song and instrument, etc.)
*Start playing by moving your fingers below your palm and following the music sheet 

Hand Music Block-Application 2
*Click "Enable Camera" and grant permissions
*Personalize the control panel based on user preferences(Select a song and instrument, difficulty level, etc.)
*Click "Start Game" and also stop the game whenever you want 
*Focus on the falling blocks and wait for the blocks to arrive in the hit area, and then bend the corresponding finger.

Browser Requirements
*Web browser (Chrome, Safari, Edge) 
*Web Audio API
*Webcam access permission

File Structure
Virtual-Music-Learning-Platform
├── index.html # Landing page
├── index_n.html # Gesture Piano (Fundamental mode)
├── script_n.js # JavaScript logic for gesture recognition
├── style_n.css # Styling of Gesture Piano
├── index_n2.html # Hand Music blocks (Advanced mode)
├── script_n2.js # JavaScript logic for block falling gameplay
├── style_n2.css # Styling of Hand Music blocks
├──README.md # Documentation










