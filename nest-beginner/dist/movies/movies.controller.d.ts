export declare class MoviesController {
    getAll(): string;
    search(seachingYear: string): string;
    getOne(movieId: string): string;
    create(movieData: any): any;
    remove(movieId: string): string;
    patch(movieId: string, updateData: any): any;
}
