import { FormData } from 'undici';

// eslint-disable-next-line max-len
const invoke = async (method, baseUrl, path = undefined, query = {}, data = undefined, token = undefined, headers = {}) => {
    const additionalHeaders = {
        ...headers,
    };
    if (data) {
        if (!(data instanceof FormData)) {
            additionalHeaders['content-type'] = 'application/json';
        } else {
            additionalHeaders['content-type'] = 'multipart/form-data';
        }
    }

    let res;
    let queryString;

    if (query) {
        queryString = Object.entries(query)
            .map(([key, value]) => `?${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
            .join('&');
    }

    try {
        res = await fetch(`${baseUrl}${path}${queryString}`, {
            method,
            headers: {
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(data),
        });
    } catch (e) {
        throw new Error(e);
    }

    if (res.status !== 200) {
        throw new Error(`Failed to fetch data: ${res.status}: ${res.statusText}, ${await res.text()}`);
    }

    const isJSON = /application\/json/i.test(res.headers.get('Content-Type'));
    return isJSON ? res.json() : res.text();
};

export default invoke;
