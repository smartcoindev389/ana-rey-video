<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\VideoComment;
use App\Models\Video;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class VideoCommentController extends Controller
{
    /**
     * Get comments for a video.
     */
    public function index(Request $request, Video $video): JsonResponse
    {
        $user = Auth::user();

        $sortBy = $request->get('sort_by', 'newest'); // newest, most_liked

        $query = VideoComment::forVideo($video->id)
            ->topLevel()
            ->with(['user', 'replies.user'])
            ->withCount('replies');

        if ($sortBy === 'most_liked') {
            $query->mostLiked();
        } else {
            $query->newest();
        }

        // Check if user liked each comment
        if ($user) {
            $comments = $query->get()->map(function ($comment) use ($user) {
                $comment->is_liked = $comment->isLikedBy($user);
                return $comment;
            });
        } else {
            $comments = $query->get()->map(function ($comment) {
                $comment->is_liked = false;
                return $comment;
            });
        }

        return response()->json([
            'success' => true,
            'data' => $comments,
        ]);
    }

    /**
     * Create a new comment.
     */
    public function store(Request $request, Video $video): JsonResponse
    {
        $user = Auth::user();

        // Check if user has access to video
        if (!$video->isAccessibleTo($user)) {
            return response()->json([
                'success' => false,
                'message' => 'You do not have access to this video.',
            ], 403);
        }

        $validated = $request->validate([
            'comment' => 'required|string|max:5000',
            'parent_id' => 'nullable|exists:video_comments,id',
            'comment_time' => 'nullable|integer|min:0',
        ]);

        $comment = VideoComment::create([
            'video_id' => $video->id,
            'user_id' => $user->id,
            'comment' => $validated['comment'],
            'parent_id' => $validated['parent_id'] ?? null,
            'comment_time' => $validated['comment_time'] ?? null,
        ]);

        // Update parent comment replies count if this is a reply
        if ($comment->parent_id) {
            VideoComment::where('id', $comment->parent_id)->increment('replies_count');
        }

        $comment->load('user');

        return response()->json([
            'success' => true,
            'message' => 'Comment added successfully.',
            'data' => $comment,
        ], 201);
    }

    /**
     * Update a comment.
     */
    public function update(Request $request, VideoComment $comment): JsonResponse
    {
        $user = Auth::user();

        // Check if user owns the comment
        if ($comment->user_id !== $user->id && !$user->isAdmin()) {
            return response()->json([
                'success' => false,
                'message' => 'You do not have permission to update this comment.',
            ], 403);
        }

        $validated = $request->validate([
            'comment' => 'required|string|max:5000',
        ]);

        $comment->update([
            'comment' => $validated['comment'],
        ]);

        $comment->load('user');

        return response()->json([
            'success' => true,
            'message' => 'Comment updated successfully.',
            'data' => $comment,
        ]);
    }

    /**
     * Delete a comment.
     */
    public function destroy(VideoComment $comment): JsonResponse
    {
        $user = Auth::user();

        // Check if user owns the comment or is admin
        if ($comment->user_id !== $user->id && !$user->isAdmin()) {
            return response()->json([
                'success' => false,
                'message' => 'You do not have permission to delete this comment.',
            ], 403);
        }

        // Update parent comment replies count if this is a reply
        if ($comment->parent_id) {
            VideoComment::where('id', $comment->parent_id)->decrement('replies_count');
        }

        $comment->delete();

        return response()->json([
            'success' => true,
            'message' => 'Comment deleted successfully.',
        ]);
    }

    /**
     * Like or unlike a comment.
     */
    public function toggleLike(VideoComment $comment): JsonResponse
    {
        $user = Auth::user();

        $isLiked = $comment->isLikedBy($user);

        if ($isLiked) {
            // Unlike
            DB::table('video_comment_likes')
                ->where('comment_id', $comment->id)
                ->where('user_id', $user->id)
                ->delete();
            $comment->decrementLikes();
            $liked = false;
        } else {
            // Like
            DB::table('video_comment_likes')->insert([
                'comment_id' => $comment->id,
                'user_id' => $user->id,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
            $comment->incrementLikes();
            $liked = true;
        }

        return response()->json([
            'success' => true,
            'message' => $liked ? 'Comment liked.' : 'Comment unliked.',
            'data' => [
                'liked' => $liked,
                'likes_count' => $comment->fresh()->likes_count,
            ],
        ]);
    }
}
