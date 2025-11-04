//const API_URL = "https://api-server-2025.azurewebsites.net/api/posts";
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

    static getPosts(query = "") {
        API.initHttpState();
        return new Promise(resolve => {
            $.ajax({
                url: API_URL + query,
                success: posts => { resolve(posts); },
                error: (xhr) => { API.setHttpErrorState(xhr); resolve(null); }
            });
        });
    }
    static getPost(postId) {
        API.initHttpState();
        return new Promise(resolve => {
            $.ajax({
                url: API_URL + "/" + postId,
                success: post => { resolve(post); },
                error: (xhr) => { API.setHttpErrorState(xhr); resolve(null); }
            });
        });
    }
    static savePost(post, create) {
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
    static deletePost(id) {
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