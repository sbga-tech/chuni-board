export interface AnchorInfo {
    open_id: string;
    room_id: number;
    code_id: string;
    uface: string;
    uid: number;
    uname: string;
}



const AUTH_ENDPOINT = `http://${window.location.hostname}:48200/bilibili-open/auth/`;
export async function fetchAnchorInfo(codeId: string):Promise<AnchorInfo|null> {
    try {
        const response = await fetch(AUTH_ENDPOINT+codeId);
        if (response.status === 500) {
            const data = await response.json();
            throw new Error(data.message);
        }else if (!response.ok) {
            throw new Error(`${response.status}`);
        }
        const data = await response.json();
        return data.data !== null ? {code_id: codeId, ...data.data} : null
    } catch (error) {
        throw new Error(`Fetch Error: ${error}`);
    }
};
