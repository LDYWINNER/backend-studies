import { MoviesService } from './movies.service';
import { Movie } from './entities/movie.entity';
export declare class MoviesController {
    private readonly moviesService;
    constructor(moviesService: MoviesService);
    getAll(): Movie[];
    getOne(movieId: string): Movie;
    create(movieData: any): void;
    remove(movieId: string): void;
    patch(movieId: string, updateData: any): void;
}
