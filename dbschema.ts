// For reference. I guess GraphQl would be nice here

type DBSchema = {
  users: [
    {
      userId: string;
      email: string;
      userHandle: string;
      createdAt: string;
      imageUrl: string;
      bio: string;
      website: string;
      location: string;
    }
  ];
  posts: [
    {
      userHandle: string;
      body: string;
      createdAt: string;
      likes: { userHandle: string }[];
      comments: { userHandle: string; body: string }[];
    }
  ];
};
