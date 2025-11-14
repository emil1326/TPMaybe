import Repository from '../models/repository.js';
import PostModel from '../models/post.js';
import Controller from './Controller.js';

export default
    class PostsController extends Controller {
    constructor(HttpContext) {
        super(HttpContext, new Repository(new PostModel()));
    }
    get(id) {
        if (this.repository != null) {
            if (id !== '') {
                let data = this.repository.get(id);
                if (data != null)
                    this.HttpContext.response.JSON(data);
                else
                    this.HttpContext.response.notFound("Resource not found.");
            } else {
                let data = this.repository.getAll(this.HttpContext.path.params);
                if (this.repository.valid())
                    this.HttpContext.response.JSON(data, this.repository.ETag, false);
                else
                    this.HttpContext.response.badRequest(this.repository.errorMessages);
            }
        } else
            this.HttpContext.response.notImplemented();
    }
}
