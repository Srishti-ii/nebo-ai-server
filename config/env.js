const required = [
"DATABASE_URL",
"GEMINI_API_KEY",
"GOOGLE_CALENDAR_ID",
"GOOGLE_CLIENT_ID",
"GOOGLE_CLIENT_SECRET"
];
required.forEach(key=>{
if(!process.env[key]){
 throw new Error(
 `${key} missing`
 );
}
});