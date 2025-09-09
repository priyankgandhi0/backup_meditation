import axios from 'axios';
import { API_SYSTEME_KEY, SYSTEME_API_URL } from '@env';

export interface AccessRule {
  tags: string[];
  courses: string[];
}

export const fullAccessTags = ['Enrolled_Holistic Membership'];

export const limitedAccessRules = {
  'Enrolled_to_Sleep_Membership': ['7'],
  'Purchased_9-Day Breathwork Course': ['4'],
  'Purchased_9-Day Meditation Course': ['5'],
  'Purchased_Swara_Yoga_Course': ['6'],
  'Purchased_9-Day Bliss Course': ['1'],
  'Purchased_12-Day ThirdEye Course': ['8'],
};

export const combinedAccessRules: AccessRule[] = [
  {
    tags: ['Enrolled_to_Sleep_Membership', 'Purchased_9-Day Breathwork Course'],
    courses: ['4', '7'],
  },
];

class AccessService {
  private headers = {
    'X-API-Key': API_SYSTEME_KEY,
    Accept: 'application/json',
    'Content-Type': 'application/json',
  };

  async getUserTags(email: string): Promise<string[]> {
    try {
      const response = await axios.get(
        `${SYSTEME_API_URL}/contacts/search?email=${email}`,
        { headers: this.headers }
      );
      return response.data.data[0]?.tags || [];
    } catch (error) {
      console.error('Error fetching user tags:', error);
      return [];
    }
  }

  hasFullAccess(userTags: string[]): boolean {
    return userTags.some(tag => fullAccessTags.includes(tag));
  }

  hasLimitedAccess(userTags: string[]): boolean {
    return userTags.some(tag => Object.keys(limitedAccessRules).includes(tag));
  }

  getAccessibleCourses(userTags: string[]): string[] {
    if (this.hasFullAccess(userTags)) {
      return ['*']; // Indicates full access to all courses
    }

    const accessibleCourses = new Set<string>();

    // Check individual access rules
    userTags.forEach(tag => {
      if (limitedAccessRules[tag]) {
        limitedAccessRules[tag].forEach(courseId => accessibleCourses.add(courseId));
      }
    });

    // Check combined access rules
    combinedAccessRules.forEach(rule => {
      if (rule.tags.every(tag => userTags.includes(tag))) {
        rule.courses.forEach(courseId => accessibleCourses.add(courseId));
      }
    });

    return Array.from(accessibleCourses);
  }
}

export const accessService = new AccessService(); 