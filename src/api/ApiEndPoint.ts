export const API_ENDPOINT = {
    //vercel
    LOGIN:'/auth/login',
    REGISTER:'/auth/register',
    FORGOT_PASSWORD:'/auth/generateResetToken',
    DELETE_USER:'/user/delete',

    GET_COURSES:'/courses/user?email=',
    GET_COURSES_SECTIONS:'/courses/course/',
    UPDATE_PROGRESS:'/courses',
    MY_PROGRESS:'/courses/my-progress',

    GET_SLEEP_MUSIC_BY_CATEGORY: '/app/musics/category?category=',
    GET_SLEEP_MUSIC_BY_FAVORITES:'/app/musics/favorites?category=',
    ADD_FAVORITES:'/user/add-favorite/music/',
    GET_CATEGORY:'/categories/',
    GET_PREVIEW_MUSICS:'/app/musics/preview?category=',

    GET_GUIDED_MEDITATION: '/app/musics/guided-meditation?',

    GET_CHAKRA:'/app/musics/shakra?',

    GET_MANTRA:'/video-content/videos?type=mantra&',

    GET_THEMES:'/themes',

    //systeme
   CONTACTS_EMAIL :'/contacts?email=',
   CONTACTS:'/contacts',
   GET_TAG:'/tags?limit=100',
   DELETE_CONTACTS:'/contacts/',

   // Chat
   CHAT_POST_MESSAGE : '/chat',
   CHAT_GET_HISTORY : '/chat/history',
   CHAT_GET_SESSIONS : '/chat/sessions',
   CHAT_GET_ANALYTICS : '/chat/analytics',
   CHAT_GET_TOPICS : '/chat/topics',
   CHAT_GET_FAQ : '/chat/faq'

}