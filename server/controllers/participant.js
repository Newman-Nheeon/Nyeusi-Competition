const emailService = require('../utils/sendEmail');
const crypto = require('crypto');
const Participant = require('../models/participant');
const checkSocialMediaHandle = require('../utils/checkSocialMedia');

exports.submitEmail = async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).send({ message: 'Email address is required' });
  }

  try {
    let participant = await Participant.findOne({ email });

    // Check if the participant has already registered and verified their email
    if (participant && participant.isEmailVerified) {
      return res.status(400).send({ message: 'Email is already verified.' });
    }

    // If already registered but not verified, resend the verification email
    if (participant && !participant.isEmailVerified) {
      await emailService.sendVerificationEmail(email, participant.verificationToken);
      return res.send({ message: 'Verification email resent.' });
    }

    // New registration
    const verificationToken = crypto.randomBytes(32).toString('hex');
    participant = new Participant({
      email,
      verificationToken,
      isEmailVerified: false,
    });

    await participant.save();
    await emailService.sendVerificationEmail(email, verificationToken);
    res.send({ message: 'Verification email sent.' });
  } catch (error) {
    console.error('Error in registering Participant:', error);
    res.status(500).send({ message: 'Failed to register user.' });
  }
};

exports.completeRegistration = async (req, res) => {
  const { email, firstName, lastName, stageName, socialMediaHandle, comment, termsAccepted, socialMediaPlatform, entrySocialPost } = req.body;
  const profileImagePath = req.files.profileImage ? req.files.profileImage[0].path : null;
  const entryImagePath = req.files.entryImage ? req.files.entryImage[0].path : null;

  try {
    const user = await Participant.findOne({ email });

    if (!user) {
      return res.status(404).send('User not found.');
    }
    if (!user.isEmailVerified) {
      return res.status(400).send('Email not verified.');
    }
    if (user.isFullyRegistered) {
      return res.status(400).send('Participant is already fully registered.');
    }

    if (!firstName || !lastName || !stageName || !socialMediaHandle || !entrySocialPost || !comment || termsAccepted === undefined || !socialMediaPlatform || !profileImagePath || !entryImagePath) {
      return res.status(400).send('All fields must be filled to complete registration.');
    }

    // Check if the social media handle exists for the given platform
    const handleExists = await checkSocialMediaHandle(socialMediaHandle, socialMediaPlatform);
    if (!handleExists) {
      return res.status(400).send('Social media handle does not exist on the specified platform.');
    }

    // Proceed with updating the user's registration details
    user.firstName = firstName;
    user.lastName = lastName;
    user.stageName = stageName;
    user.socialMediaHandle = socialMediaHandle;
    user.entrySocialPost = entrySocialPost;
    user.comment = comment;
    user.termsAccepted = termsAccepted;
    user.socialMediaPlatform = socialMediaPlatform;
    user.profileImage = profileImagePath;
    user.entryImage = entryImagePath;
    user.isFullyRegistered = true;

    await user.save();
    res.send('Registration complete. Thank you for completing your registration.');
  } catch (error) {
    console.error('Error completing registration:', error);
    res.status(500).send('Error completing registration.');
  }
};






exports.verifyEmail = async (req, res) => {
  const URL = process.env.FRONTEND_URL
  const { token } = req.query;

  try {
    const user = await Participant.findOne({ verificationToken: token });

    if (!user) {
      return res.status(400).send({ message: 'Invalid or expired verification token.' });
    }

    user.isEmailVerified = true; // Corrected field name
    user.verificationToken = ''; // Clear the verification token
    await user.save();

    res.json({
      message: 'Email verified successfully',
      redirectTo: `${URL}/verification`
    });
  } catch (error) {
    console.error('Error verifying email:', error); // Added console.error for debugging
    res.status(500).send({ message: 'Failed to verify email.' });
  }
};

