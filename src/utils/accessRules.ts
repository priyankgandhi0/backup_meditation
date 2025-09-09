// accessRules.ts

export const fullAccessTags = [
    'Enrolled_Holistic Membership'
  ];

  export const fullAccessMemberTags = [
  'Enrolled_Holistic Membership'
  ];
  export const limitedAccessTags = [
    'Purchased_9-Day Breathwork Course',
    'Purchased_9-Day Bliss Course',
    'Purchased_9-Day Meditation Course',
    'Purchased_Swara_Yoga_Course',
    'Enrolled_to_Sleep_Membership',
    'Purchased_12-Day ThirdEye Course',
    'Purchased_7-Chakra-Healing-Music'
  ];
  
  export const limitedAccessRules: Record<string, string[]> = {
    'Enrolled_to_Sleep_Membership': ['7'], // Access to Sleep Course only (ID: 7)
    'Purchased_9-Day Breathwork Course': ['4'], // Access to 9-Day-Breathwork course only (ID: 4)
    'Purchased_9-Day Meditation Course': ['5'], // Access to 9-Day-Meditation course only (ID: 5)
    'Purchased_Swara_Yoga_Course': ['6'], // Access to Swara_Yoga_Course only (ID: 5)
    'Purchased_9-Day Bliss Course': ['1'], // Access to Bliss course only (ID: 5)
    'Purchased_12-Day ThirdEye Course': ['8']
  };
  
  export const combinedAccessRules = [
    {
      tags: ['Enrolled_to_Sleep_Membership', 'Purchased_9-Day Breathwork Course'],
      courses: ['4', '7'], // Access to Sleep Course and 9-Day-Breathwork course
    },
    {
      tags: ['Purchased_9-Day Breathwork Course', 'Purchased_9-Day Meditation Course'],
      courses: ['4', '5',], // Access to 9-Day-Breathwork, 9-Day-Meditation, and Default (Free) Sleep Music feature
    },
  ];
  