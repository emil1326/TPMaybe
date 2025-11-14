// const API_URL = "https://emilsnodejstest1.azurewebsites.net/api/posts";
const API_URL = "http://localhost:5000/api/posts";
class API {
    static initHttpState() {
        this.currentHttpError = "";
        this.currentStatus = 0;
        this.error = false;
    }
    static setHttpErrorState(xhr) {
        if (xhr.responseJSON)
            this.currentHttpError = xhr.responseJSON.error_description;
        else
            this.currentHttpError = xhr.statusText == 'error' ? "Service introuvable" : xhr.statusText;
        this.currentStatus = xhr.status;
        this.error = true;
    }

    // ETag / periodic refresh state
    static currentETag = '';
    static hold_Periodic_Refresh = false;
    static periodicRefreshPeriod = 5; // seconds

    static start_Periodic_Refresh(callback) {
        callback();
        setInterval(async () => {
            if (!this.hold_Periodic_Refresh) {
                let etag = await this.HEAD();
                if (this.currentETag != etag) {
                    this.currentETag = etag;
                    callback();
                }
            }
        }, this.periodicRefreshPeriod * 1000);
    }
    static resume_Periodic_Refresh() { this.hold_Periodic_Refresh = false; }
    static stop_Periodic_Refresh() { this.hold_Periodic_Refresh = true; }

    static async HEAD() {
        API.initHttpState();
        return new Promise(resolve => {
            $.ajax({
                url: API_URL,
                type: 'HEAD',
                contentType: 'text/plain',
                complete: data => {
                    resolve(data.getResponseHeader('ETag'));
                },
                error: (xhr) => { API.setHttpErrorState(xhr); resolve(null); }
            });
        });
    }

    // Get with full response (ETag + data)
    static async Get(id = null) {
        API.initHttpState();
        return new Promise(resolve => {
            $.ajax({
                url: API_URL + (id != null ? "/" + id : ""),
                complete: data => {
                    this.currentETag = data.getResponseHeader('ETag');
                    resolve({ ETag: this.currentETag, data: data.responseJSON });
                },
                error: (xhr) => { API.setHttpErrorState(xhr); resolve(null); }
            });
        });
    }

    // Query endpoint (used for lists / select)
    static async GetQuery(queryString = "") {
        API.initHttpState();
        return new Promise(resolve => {
            $.ajax({
                url: API_URL + queryString,
                complete: data => {
                    resolve({ ETag: data.getResponseHeader('ETag'), data: data.responseJSON });
                },
                error: (xhr) => { API.setHttpErrorState(xhr); resolve(null); }
            });
        });
    }

    // Backwards-compatible simple methods used by siteUI
    static async getPosts(query = "") {
        let response = await API.GetQuery(query);
        return response ? response.data : null;
    }
    static async getPost(postId) {
        let response = await API.Get(postId);
        return response ? response.data : null;
    }

    static async savePost(post, create) {
        API.initHttpState();
        return new Promise(resolve => {
            $.ajax({
                url: create ? API_URL : API_URL + "/" + post.Id,
                type: create ? "POST" : "PUT",
                contentType: 'application/json',
                data: JSON.stringify(post),
                success: (/*data*/) => { resolve(true); },
                error: (xhr) => { API.setHttpErrorState(xhr); resolve(null); }
            });
        });
    }
    static async deletePost(id) {
        API.initHttpState();
        return new Promise(resolve => {
            $.ajax({
                url: API_URL + "/" + id,
                type: "DELETE",
                success: () => { resolve(true); },
                error: (xhr) => { API.setHttpErrorState(xhr); resolve(null); }
            });
        });
    }
}