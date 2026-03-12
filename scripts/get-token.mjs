
const params = new URLSearchParams({
    code: "1000.0d205f377bd47e63d755fa62abadd566.26496106c551afd9719715975b28bb60",
    client_id: "1000.UYJEDCW00IM1JIV12GDA44KMVXTCYP",
    client_secret: "161179db33053409212b1fec219de25a3eb5315e57",
    grant_type: "authorization_code",
    redirect_uri: "http://localhost"
});

console.log("Fetching token...");
try {
    const res = await fetch("https://accounts.zoho.com/oauth/v2/token", {
        method: "POST",
        body: params
    });
    const data = await res.json();
    console.log(JSON.stringify(data, null, 2));
} catch (e) {
    console.error(e);
}
