import next, { GetStaticProps } from 'next';
import Prismic from '@prismicio/client';
import Head from 'next/head';
import Link from 'next/link';

import { format } from 'date-fns';

import { FiCalendar, FiUser } from 'react-icons/fi';

import { useState } from 'react';
import { getPrismicClient } from '../services/prismic';

import commonStyles from '../styles/common.module.scss';
import styles from './home.module.scss';

interface Post {
  uid?: string;
  first_publication_date: string | null;
  data: {
    title: string;
    subtitle: string;
    author: string;
  };
}

interface PostPagination {
  next_page: string;
  results: Post[];
}

interface HomeProps {
  postsPagination: PostPagination;
}

export default function Home({ postsPagination }: HomeProps): JSX.Element {
  const { next_page, results } = postsPagination;

  const [posts, setPosts] = useState(results);
  const [nextPage, setNextPage] = useState(next_page);

  // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
  async function handleRenderPosts() {
    const response = await fetch(next_page);
    const data = await response.json();

    setPosts([...posts, ...data.results]);
    setNextPage(data.next_page);
  }

  return (
    <>
      <Head>
        <title>Home | spacetraveling</title>
      </Head>

      <main className={styles.container}>
        <img src="/images/logo.svg" alt="logo" />

        {!!posts &&
          posts.map(post => (
            <div className={commonStyles.post} key={post.uid}>
              <Link href={`/post/${post.uid}`}>
                <a>
                  <h1>{post.data.title}</h1>
                </a>
              </Link>
              <p>{post.data.subtitle}</p>

              <div className={styles.icons}>
                <div>
                  <FiCalendar />
                  <span>
                    {format(
                      new Date(post.first_publication_date),
                      'dd MMM yyyy'
                    ).toLowerCase()}
                  </span>
                </div>
                <div>
                  <FiUser />
                  {post.data.author}
                </div>
              </div>
            </div>
          ))}

        {!!nextPage && (
          <button type="button" onClick={handleRenderPosts}>
            Carregar mais posts
          </button>
        )}
      </main>
    </>
  );
}

export const getStaticProps: GetStaticProps = async () => {
  const prismic = getPrismicClient();
  const postsResponse = await prismic.query(
    Prismic.Predicates.at('document.type', 'post'),
    { pageSize: 100, fetch: ['post.title', 'post.subtitle', 'post.author'] }
  );

  const posts = postsResponse.results.map(post => {
    return {
      uid: post.uid,
      first_publication_date: post.first_publication_date,
      data: {
        title: post.data.title,
        subtitle: post.data.subtitle,
        author: post.data.author,
      },
    };
  });

  return {
    props: {
      postsPagination: {
        next_page: postsResponse.next_page,
        results: posts,
      },
    },
  };
};
